import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { profile, tenant } = useAuth();

  // إحصائيات الزبائن
  const { data: customersCount } = useQuery({
    queryKey: ['stats-customers', tenant?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false);
      return count ?? 0;
    },
    enabled: !!tenant?.id,
  });

  // إحصائيات الطلبات
  const { data: ordersStats } = useQuery({
    queryKey: ['stats-orders', tenant?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayRes, sewingRes, readyRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .in('status', ['cutting', 'sewing', 'ironing']),
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .eq('status', 'ready'),
      ]);

      return {
        today: todayRes.count ?? 0,
        sewing: sewingRes.count ?? 0,
        ready: readyRes.count ?? 0,
      };
    },
    enabled: !!tenant?.id,
  });

  // آخر الزبائن
  const { data: recentCustomers } = useQuery({
    queryKey: ['recent-customers', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, full_name, phone, customer_number, created_at')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!tenant?.id,
  });

  const cards = [
    { label: 'إجمالي الزبائن', value: customersCount ?? 0, icon: '👥', color: 'from-blue-500 to-blue-700' },
    { label: 'طلبات اليوم', value: ordersStats?.today ?? 0, icon: '📋', color: 'from-emerald-500 to-emerald-700' },
    { label: 'قيد الخياطة', value: ordersStats?.sewing ?? 0, icon: '🧵', color: 'from-amber-500 to-amber-700' },
    { label: 'جاهزة للتسليم', value: ordersStats?.ready ?? 0, icon: '✅', color: 'from-green-500 to-green-700' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

  return (
    <div>
      {/* Welcome */}
      <div className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-6 mb-6 text-white shadow">
        <p className="text-brand-100 text-sm">{greeting} 👋</p>
        <h2 className="text-2xl font-bold mt-1">{profile?.full_name || 'مرحباً'}</h2>
        <p className="text-brand-100 text-sm mt-1">
          {tenant?.name && `محل: ${tenant.name}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
          >
            <div
              className={`bg-gradient-to-br ${c.color} text-white rounded-xl w-12 h-12 flex items-center justify-center text-2xl mb-3`}
            >
              {c.icon}
            </div>
            <div className="text-3xl font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🕐</span> آخر الزبائن
          </h3>
          <Link
            to="/customers"
            className="text-sm text-brand-600 hover:text-brand-800 hover:underline font-medium"
          >
            عرض الكل ←
          </Link>
        </div>

        {!recentCustomers || recentCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3 opacity-40">👤</div>
            <p className="text-gray-500 text-sm mb-3">لا يوجد زبائن بعد</p>
            <Link
              to="/customers"
              className="inline-block text-brand-600 hover:underline text-sm font-medium"
            >
              + أضف أول زبون
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCustomers.map((c: any) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                    {c.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{c.full_name}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 font-mono">{c.customer_number}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(c.created_at).toLocaleDateString('ar-IQ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Status */}
      <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-800 p-3 rounded-xl text-xs text-center">
        حالة الاشتراك: <span className="font-bold">
          {tenant?.plan === 'trial' ? 'تجريبي' : tenant?.plan}
        </span>
        {tenant?.expires_at && (
          <>
            {' — '}
            ينتهي في: <span className="font-bold">
              {new Date(tenant.expires_at).toLocaleDateString('ar-IQ')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}