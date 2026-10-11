import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  addPayment,
  getOrder,
  listPayments,
  ORDER_STATUSES,
  updateOrderStatus,
  type OrderStatus,
} from '../api/orders';

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { tenant } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });
  const [error, setError] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => listPayments(id!),
    enabled: !!id,
  });

  const statusMut = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status, tenant!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  const payMut = useMutation({
    mutationFn: (data: any) => addPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['payments', id] });
      setShowPayment(false);
      setPaymentForm({ amount: '', notes: '' });
    },
    onError: (e: any) => setError(e.message || 'فشل تسجيل الدفعة'),
  });

  const onPaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) return setError('المبلغ غير صحيح');
    if (amt > order.remaining) return setError(`المبلغ أكبر من المتبقي (${order.remaining})`);
    payMut.mutate({
      tenant_id: tenant!.id,
      order_id: id!,
      amount: amt,
      notes: paymentForm.notes,
      current_deposit: order.deposit,
      final_price: order.final_price,
    });
  };

  if (isLoading || !order) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>;
  }

  const statusObj = ORDER_STATUSES.find((s) => s.key === order.status);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          ← رجوع للطلبات
        </Link>
        <Link
          to={`/orders/${id}/invoice`}
          className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
        >
          🖨️ <span>طباعة الفاتورة</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-6 mb-5 text-white shadow">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-brand-100 text-sm font-mono">{order.order_number}</div>
            <h1 className="text-2xl font-bold mt-1">{order.customer?.full_name}</h1>
            <div className="text-brand-100 text-sm mt-1">📱 {order.customer?.phone}</div>
          </div>
          {statusObj && (
            <span className={`${statusObj.color} text-sm font-bold px-3 py-1.5 rounded-xl`}>
              {statusObj.label}
            </span>
          )}
        </div>
      </div>

      {/* تغيير الحالة */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">🔄 تغيير الحالة</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => statusMut.mutate(s.key)}
              disabled={statusMut.isPending || order.status === s.key}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                order.status === s.key
                  ? 'bg-brand-700 text-white cursor-default'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* تفاصيل */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-bold text-gray-800 mb-4">🧵 تفاصيل الطلب</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {order.dishdasha_type && <Row label="نوع الدشداشة" value={order.dishdasha_type} />}
          {order.fabric_type && <Row label="نوع القماش" value={order.fabric_type} />}
          {order.fabric_color && <Row label="لون القماش" value={order.fabric_color} />}
          <Row label="العدد" value={order.quantity} />
          {order.delivery_date && (
            <Row
              label="موعد التسليم"
              value={new Date(order.delivery_date).toLocaleDateString('ar-IQ')}
            />
          )}
          {order.design_notes && <Row label="تصميم" value={order.design_notes} full />}
          {order.notes && <Row label="ملاحظات" value={order.notes} full />}
        </div>
      </div>

      {/* الحساب */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 rounded-2xl p-5 mb-4 text-white shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">💰 الحساب</h3>
          {order.remaining > 0 && (
            <button
              onClick={() => setShowPayment(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              + سجّل دفعة
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="الإجمالي" value={order.total_price} />
          <Stat label="الخصم" value={order.discount} />
          <Stat label="بعد الخصم" value={order.final_price} />
          <Stat label="العربون" value={order.deposit} />
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-emerald-100 text-sm">المتبقي</span>
          <span
            className={`text-3xl font-bold ${order.remaining > 0 ? 'text-amber-200' : 'text-white'}`}
          >
            {order.remaining.toLocaleString()} <span className="text-lg">د.ع</span>
          </span>
        </div>
      </div>

      {/* الدفعات */}
      {payments && payments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-bold text-gray-800 mb-3">💳 سجل الدفعات</h3>
          <div className="divide-y divide-gray-100">
            {payments.map((p: any) => (
              <div key={p.id} className="flex justify-between py-2 text-sm">
                <div>
                  <div className="font-semibold text-gray-800">
                    {p.amount.toLocaleString()} د.ع
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(p.payment_date).toLocaleDateString('ar-IQ')}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{p.method}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal الدفعة */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4">تسجيل دفعة</h3>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm mb-4">
              المتبقي الحالي:{' '}
              <span className="font-bold">{order.remaining.toLocaleString()} د.ع</span>
            </div>
            <form onSubmit={onPaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">المبلغ *</label>
                <input
                  type="number"
                  min="1"
                  max={order.remaining}
                  required
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-center focus:border-brand-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl">⚠️ {error}</div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayment(false);
                    setError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={payMut.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60"
                >
                  {payMut.isPending ? '⏳...' : '💾 حفظ الدفعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: any; full?: boolean }) {
  return (
    <div
      className={`flex justify-between border-b border-gray-100 py-2 ${
        full ? 'col-span-2' : ''
      }`}
    >
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <div className="text-emerald-100 text-xs">{label}</div>
      <div className="font-bold text-base mt-1">{value?.toLocaleString() || 0}</div>
    </div>
  );
}