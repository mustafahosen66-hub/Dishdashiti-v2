import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { listOrders, ORDER_STATUSES, type OrderStatus } from '../api/orders';

export default function Orders() {
  const { tenant } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', tenant?.id, statusFilter, search],
    queryFn: () =>
      listOrders({
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    enabled: !!tenant?.id,
  });

  const statusBadge = (key: string) => {
    const s = ORDER_STATUSES.find((x) => x.key === key);
    return s ? (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${s.color}`}>{s.label}</span>
    ) : (
      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{key}</span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الطلبات</h2>
          <p className="text-sm text-gray-500 mt-0.5">{orders?.length ?? 0} طلب</p>
        </div>
        <Link
          to="/orders/new"
          className="bg-gradient-to-l from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>طلب جديد</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="flex gap-2 mb-3"
        >
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث برقم الطلب أو اسم الزبون..."
              className="w-full border-2 border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-5 rounded-xl text-sm font-medium">
            بحث
          </button>
        </form>

        {/* Status chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !statusFilter ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === s.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>
        ) : !orders?.length ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-3 opacity-30">📋</div>
            <p className="text-gray-500 font-medium">
              {search || statusFilter ? 'لا توجد نتائج' : 'لا يوجد طلبات بعد'}
            </p>
            {!search && !statusFilter && (
              <Link to="/orders/new" className="mt-4 inline-block text-brand-600 hover:underline text-sm font-semibold">
                + أنشئ أول طلب
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-gray-500">{o.order_number}</span>
                      {statusBadge(o.status)}
                    </div>
                    <div className="font-semibold text-gray-800 truncate">
                      {o.customer?.full_name || 'عميل'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {o.quantity} قطعة • {o.final_price?.toLocaleString() || 0} د.ع
                    </div>
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  {o.remaining > 0 && (
                    <div className="text-xs font-bold text-red-600 mb-1">
                      متبقي: {o.remaining.toLocaleString()}
                    </div>
                  )}
                  {o.delivery_date && (
                    <div className="text-[10px] text-gray-400">
                      تسليم: {new Date(o.delivery_date).toLocaleDateString('ar-IQ')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}