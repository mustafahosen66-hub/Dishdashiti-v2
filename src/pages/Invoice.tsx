import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOrder, listPayments } from '../api/orders';

export default function Invoice() {
  const { id } = useParams();
  const { tenant } = useAuth();

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

  if (isLoading || !order) {
    return <div className="p-8 text-center text-gray-400">جارٍ التحميل...</div>;
  }

  const handlePrint = () => window.print();

  return (
    <>
      {/* أزرار التحكم */}
      <div className="max-w-3xl mx-auto mb-4 no-print flex flex-wrap gap-2 justify-between">
        <Link
          to={`/orders/${id}`}
          className="text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          ← رجوع للطلب
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
          >
            🖨️ طباعة الفاتورة
          </button>
          <a
            href={`https://wa.me/${order.customer?.phone.replace(/^0/, '964')}?text=${encodeURIComponent(
              `مرحباً ${order.customer?.full_name}\nطلبكم ${order.order_number} جاهز.\nالمبلغ المتبقي: ${order.remaining.toLocaleString()} د.ع`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
          >
            💬 واتساب
          </a>
        </div>
      </div>

      {/* الفاتورة */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print-page">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-brand-700 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-2xl">
                🧵
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-800">{tenant?.name || 'محل'}</h1>
                <p className="text-xs text-gray-500">نظام إدارة الدشداشة</p>
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-sm text-gray-500">رقم الطلب</div>
            <div className="font-mono font-bold text-lg text-brand-700">{order.order_number}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(order.order_date).toLocaleDateString('ar-IQ')}
            </div>
          </div>
        </div>

        {/* بيانات الزبون */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">بيانات الزبون</div>
            <div className="font-bold text-gray-800">{order.customer?.full_name}</div>
            <div className="text-sm text-gray-600">📱 {order.customer?.phone}</div>
            {order.customer?.address && (
              <div className="text-sm text-gray-600">📍 {order.customer.address}</div>
            )}
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500 mb-1">معلومات إضافية</div>
            {order.customer?.customer_number && (
              <div className="text-sm">رقم الزبون: <span className="font-mono">{order.customer.customer_number}</span></div>
            )}
            {order.delivery_date && (
              <div className="text-sm">
                موعد التسليم: <span className="font-bold">
                  {new Date(order.delivery_date).toLocaleDateString('ar-IQ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* تفاصيل الطلب */}
        <table className="w-full text-sm mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right p-2 font-semibold">الوصف</th>
              <th className="text-center p-2 font-semibold">العدد</th>
              <th className="text-center p-2 font-semibold">سعر القطعة</th>
              <th className="text-left p-2 font-semibold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">
                <div className="font-semibold">
                  {order.dishdasha_type || 'دشداشة'} — {order.fabric_type || 'قماش'}
                </div>
                <div className="text-xs text-gray-500">
                  {order.fabric_color && `اللون: ${order.fabric_color}`}
                  {order.design_notes && ` • ${order.design_notes}`}
                </div>
              </td>
              <td className="text-center p-3">{order.quantity}</td>
              <td className="text-center p-3">{order.unit_price.toLocaleString()}</td>
              <td className="text-left p-3 font-bold">{order.total_price.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* الحساب */}
        <div className="flex justify-end mb-6">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">الإجمالي:</span>
              <span className="font-semibold">{order.total_price.toLocaleString()} د.ع</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between py-1 text-red-600">
                <span>الخصم:</span>
                <span className="font-semibold">-{order.discount.toLocaleString()} د.ع</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-b font-bold">
              <span>الصافي:</span>
              <span>{order.final_price.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">المدفوع:</span>
              <span className="font-semibold text-emerald-600">{order.deposit.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between py-2 bg-amber-50 rounded-lg px-3 font-bold text-amber-800">
              <span>المتبقي:</span>
              <span>{order.remaining.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>

        {/* الدفعات */}
        {payments && payments.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-2">سجل الدفعات:</div>
            <div className="text-xs space-y-1">
              {payments.map((p: any) => (
                <div key={p.id} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-600">
                    {new Date(p.payment_date).toLocaleDateString('ar-IQ')}
                  </span>
                  <span className="font-semibold">{p.amount.toLocaleString()} د.ع</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="flex items-center justify-center my-6">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
              window.location.origin + '/orders/' + order.id
            )}`}
            alt="QR Code"
            className="w-28 h-28"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          شكراً لتعاملكم معنا 🙏
          <br />
          نظام دشداشتي — 2026
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; border: none !important; }
          header, footer, nav { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </>
  );
}