import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createOrder, getNextOrderNumber } from '../api/orders';

const DISHDASHA_TYPES = ['عراقي', 'سعودي', 'إماراتي', 'صيفي', 'شتوي', 'مطرز', 'عادي'];

export default function NewOrder() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tenant } = useAuth();

  const [form, setForm] = useState({
    customer_id: '',
    quantity: 1,
    unit_price: '',
    discount: 0,
    deposit: 0,
    delivery_date: '',
    dishdasha_type: '',
    fabric_type: '',
    fabric_color: '',
    design_notes: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['customers-list', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, full_name, phone, customer_number')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const num = await getNextOrderNumber(tenant!.id);
      const qty = Number(form.quantity) || 1;
      const price = Number(form.unit_price) || 0;
      const disc = Number(form.discount) || 0;
      const dep = Number(form.deposit) || 0;
      const total = qty * price;
      const final = total - disc;
      const remaining = final - dep;

      return createOrder({
        tenant_id: tenant!.id,
        order_number: num,
        customer_id: form.customer_id,
        quantity: qty,
        unit_price: price,
        discount: disc,
        deposit: dep,
        total_price: total,
        final_price: final,
        remaining,
        delivery_date: form.delivery_date || null,
        dishdasha_type: form.dishdasha_type || null,
        fabric_type: form.fabric_type || null,
        fabric_color: form.fabric_color || null,
        design_notes: form.design_notes || null,
        notes: form.notes || null,
        status: 'new',
      });
    },
    onSuccess: (order: any) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${order.id}`);
    },
    onError: (e: any) => setError(e.message || 'فشل الحفظ'),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customer_id) return setError('اختر الزبون');
    if (!form.unit_price || Number(form.unit_price) <= 0) return setError('أدخل سعر القطعة');
    saveMut.mutate();
  };

  // حساب
  const qty = Number(form.quantity) || 1;
  const price = Number(form.unit_price) || 0;
  const disc = Number(form.discount) || 0;
  const dep = Number(form.deposit) || 0;
  const total = qty * price;
  const final = total - disc;
  const remaining = final - dep;

  if (!customers || customers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4 opacity-30">👥</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">لا يوجد زبائن بعد</h2>
        <p className="text-gray-500 mb-4">أضف زبوناً أولاً قبل إنشاء طلب</p>
        <Link
          to="/customers"
          className="inline-block bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold"
        >
          + أضف زبون
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium mb-3">
        ← رجوع للطلبات
      </Link>

      <div className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-6 mb-5 text-white shadow">
        <h1 className="text-2xl font-bold">📋 طلب جديد</h1>
        <p className="text-brand-100 text-sm mt-1">سجّل تفاصيل طلب التفصيل</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* الزبون */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">👤 الزبون</h3>
          <select
            required
            value={form.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">— اختر الزبون —</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.phone} ({c.customer_number})
              </option>
            ))}
          </select>
        </div>

        {/* تفاصيل الدشداشة */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">🧵 تفاصيل الدشداشة</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">نوع الدشداشة</label>
              <select
                value={form.dishdasha_type}
                onChange={(e) => setForm({ ...form, dishdasha_type: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">— اختر —</option>
                {DISHDASHA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">نوع القماش</label>
              <input
                type="text"
                value={form.fabric_type}
                onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
                placeholder="قطن، حرير..."
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">لون القماش</label>
              <input
                type="text"
                value={form.fabric_color}
                onChange={(e) => setForm({ ...form, fabric_color: e.target.value })}
                placeholder="أبيض، بيج..."
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">موعد التسليم</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات التصميم</label>
            <textarea
              value={form.design_notes}
              onChange={(e) => setForm({ ...form, design_notes: e.target.value })}
              rows={2}
              placeholder="التفاصيل الإضافية..."
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* الأسعار */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">💰 السعر والدفع</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">عدد الدشاديش *</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-center focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">سعر القطعة *</label>
              <input
                type="number"
                min="0"
                required
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                placeholder="0"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-center focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الخصم</label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">العربون</label>
              <input
                type="number"
                min="0"
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ملخص الحساب */}
          <div className="mt-4 bg-gradient-to-l from-emerald-600 to-emerald-800 rounded-xl p-4 text-white grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-emerald-100 text-xs">الإجمالي</div>
              <div className="font-bold text-lg">{total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-emerald-100 text-xs">بعد الخصم</div>
              <div className="font-bold text-lg">{final.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-emerald-100 text-xs">العربون</div>
              <div className="font-bold text-lg">{dep.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-emerald-100 text-xs">المتبقي</div>
              <div className="font-bold text-lg text-amber-200">{remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* ملاحظات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات عامة</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">⚠️ {error}</div>
        )}

        <div className="flex gap-3 justify-end sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-2xl shadow border border-gray-100">
          <Link to="/orders" className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="px-6 py-3 rounded-xl bg-gradient-to-l from-brand-700 to-brand-800 text-white font-bold text-sm shadow disabled:opacity-60"
          >
            {saveMut.isPending ? '⏳ جارٍ الحفظ...' : '💾 حفظ الطلب'}
          </button>
        </div>
      </form>
    </div>
  );
}