import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  createExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  listExpenses,
} from '../api/expenses';

export default function Expenses() {
  const { tenant } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({
    category: 'other',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', tenant?.id, filterCat],
    queryFn: () => listExpenses({ category: filterCat || undefined }),
    enabled: !!tenant?.id,
  });

  const createMut = useMutation({
    mutationFn: (data: any) =>
      createExpense({
        ...data,
        tenant_id: tenant!.id,
        amount: Number(data.amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setShowAdd(false);
      setForm({
        category: 'other',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
      setError('');
    },
    onError: (e: any) => setError(e.message || 'فشل الحفظ'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) return setError('أدخل مبلغاً صحيحاً');
    createMut.mutate(form);
  };

  const catName = (key: string) =>
    EXPENSE_CATEGORIES.find((c) => c.key === key)?.label ?? key;

  const total = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المصاريف</h2>
          <p className="text-sm text-gray-500 mt-0.5">{expenses?.length ?? 0} مصروف</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-l from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>مصروف جديد</span>
        </button>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-l from-red-600 to-red-800 rounded-2xl p-5 mb-4 text-white shadow">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl w-14 h-14 flex items-center justify-center text-3xl">
            💸
          </div>
          <div>
            <div className="text-red-100 text-sm">إجمالي المصاريف المعروضة</div>
            <div className="text-3xl font-bold mt-1">
              {total.toLocaleString()} <span className="text-lg">د.ع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            !filterCat ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          الكل
        </button>
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterCat === c.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>
        ) : !expenses?.length ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-3 opacity-30">💸</div>
            <p className="text-gray-500 font-medium">لا يوجد مصاريف</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold">
                    💸
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{catName(e.category)}</div>
                    {e.description && <div className="text-xs text-gray-500">{e.description}</div>}
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(e.expense_date).toLocaleDateString('ar-IQ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-lg font-bold text-red-600">
                      {Number(e.amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">د.ع</div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('حذف هذا المصروف؟')) deleteMut.mutate(e.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-lg"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-5">مصروف جديد</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">التصنيف *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">المبلغ *</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-center focus:border-brand-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">الوصف</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              {error && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl">⚠️ {error}</div>}
              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setError('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-red-600 to-red-700 text-white text-sm font-bold disabled:opacity-60"
                >
                  {createMut.isPending ? '⏳...' : '💾 حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}