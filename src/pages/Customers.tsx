import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  archiveCustomer,
  createCustomer,
  getNextCustomerNumber,
  listCustomers,
  updateCustomer,
  type Customer,
} from '../api/customers';

export default function Customers() {
  const { tenant, profile } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    governorate: '',
    notes: '',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', tenant?.id, search],
    queryFn: () => listCustomers(search || undefined),
    enabled: !!tenant?.id,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateCustomer(editing.id, {
          full_name: form.full_name,
          phone: form.phone,
          address: form.address || null,
          governorate: form.governorate || null,
          notes: form.notes || null,
        });
      } else {
        const num = await getNextCustomerNumber(tenant!.id);
        return createCustomer({
  full_name: form.full_name,
  phone: form.phone,
  address: form.address || undefined,
  governorate: form.governorate || undefined,
  notes: form.notes || undefined,
  customer_number: num,
  tenant_id: tenant!.id,
});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      closeForm();
    },
    onError: (e: any) => setError(e.message || 'فشل الحفظ'),
  });

  const archiveMut = useMutation({
    mutationFn: archiveCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: '', phone: '', address: '', governorate: '', notes: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      phone: c.phone,
      address: c.address || '',
      governorate: c.governorate || '',
      notes: c.notes || '',
    });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.full_name.trim().length < 2) return setError('الاسم قصير جداً');
    if (form.phone.trim().length < 6) return setError('رقم الهاتف غير صحيح');
    saveMut.mutate();
  };

  if (!profile) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الزبائن</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {customers?.length ?? 0} زبون مسجل
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-l from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>زبون جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف أو رقم الزبون..."
              className="w-full border-2 border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 rounded-xl text-sm font-medium transition"
          >
            بحث
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>
        ) : !customers?.length ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-3 opacity-30">👥</div>
            <p className="text-gray-500 font-medium">
              {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد زبائن بعد'}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                className="mt-4 text-brand-600 hover:underline text-sm font-semibold"
              >
                + أضف أول زبون
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-600 text-xs uppercase">
                    <th className="text-right px-4 py-3 font-semibold">الرقم</th>
                    <th className="text-right px-4 py-3 font-semibold">الاسم</th>
                    <th className="text-right px-4 py-3 font-semibold">الهاتف</th>
                    <th className="text-right px-4 py-3 font-semibold">المحافظة</th>
                    <th className="text-left px-4 py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {c.customer_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                            {c.full_name.charAt(0)}
                          </div>
                          <Link to={`/customers/${c.id}`} className="font-medium text-gray-800 hover:text-brand-700 hover:underline">
  {c.full_name}
</Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{c.governorate || '—'}</td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(c)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`أرشفة ${c.full_name}؟`)) archiveMut.mutate(c.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            أرشفة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {customers.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                      {c.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <Link to={`/customers/${c.id}`} className="font-semibold text-gray-800 hover:text-brand-700">
  {c.full_name}
</Link>
                      <div className="text-xs text-gray-500 font-mono">{c.phone}</div>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {c.customer_number}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 text-xs px-3 py-1.5 bg-blue-50 rounded-lg"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`أرشفة ${c.full_name}؟`)) archiveMut.mutate(c.id);
                      }}
                      className="text-red-600 text-xs px-3 py-1.5 bg-red-50 rounded-lg"
                    >
                      أرشفة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800">
                {editing ? 'تعديل زبون' : 'زبون جديد'}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="علي حسين محمد"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  رقم الهاتف *
                </label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="077xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  المحافظة
                </label>
                <input
                  type="text"
                  value={form.governorate}
                  onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="بغداد"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  العنوان
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="الكرادة - شارع..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="اختياري"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saveMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-brand-700 to-brand-800 text-white text-sm font-bold disabled:opacity-60"
                >
                  {saveMut.isPending ? '⏳ جارٍ الحفظ...' : editing ? '💾 تحديث' : '💾 حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}