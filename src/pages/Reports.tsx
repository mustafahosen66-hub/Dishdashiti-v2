import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Period = 'today' | 'week' | 'month' | 'year';

export default function Reports() {
  const { tenant } = useAuth();
  const [period, setPeriod] = useState<Period>('month');

  const { from, to } = getRange(period);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports', tenant?.id, period],
    queryFn: async () => {
      const [ordersRes, paymentsRes, expensesRes, customersRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .gte('order_date', from)
          .lte('order_date', to)
          .neq('status', 'cancelled'),
        supabase
          .from('payments')
          .select('amount, payment_date')
          .gte('payment_date', from)
          .lte('payment_date', to),
        supabase
          .from('expenses')
          .select('amount, expense_date')
          .gte('expense_date', from.split('T')[0])
          .lte('expense_date', to.split('T')[0]),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', from)
          .lte('created_at', to),
      ]);

      const orders = ordersRes.data || [];
      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];

      const totalSales = orders.reduce((s, o) => s + Number(o.final_price), 0);
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalRemaining = orders.reduce((s, o) => s + Number(o.remaining), 0);

      return {
        ordersCount: orders.length,
        customersAdded: customersRes.count || 0,
        totalSales,
        totalPaid,
        totalRemaining,
        totalExpenses,
        netProfit: totalPaid - totalExpenses,
        orders,
      };
    },
    enabled: !!tenant?.id,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">التقارير</h2>

      {/* Period Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap gap-2">
        {[
          { key: 'today', label: 'اليوم' },
          { key: 'week', label: 'هذا الأسبوع' },
          { key: 'month', label: 'هذا الشهر' },
          { key: 'year', label: 'هذه السنة' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key as Period)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              period === p.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>
      ) : (
        <>
          {/* المبيعات */}
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>💵</span> المبيعات
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card label="عدد الطلبات" value={stats?.ordersCount ?? 0} icon="📋" color="from-blue-500 to-blue-700" />
            <Card label="إجمالي المبيعات" value={stats?.totalSales ?? 0} icon="💵" color="from-emerald-500 to-emerald-700" currency />
            <Card label="المقبوضات" value={stats?.totalPaid ?? 0} icon="💰" color="from-teal-500 to-teal-700" currency />
            <Card label="المتبقي (ديون)" value={stats?.totalRemaining ?? 0} icon="⏰" color="from-amber-500 to-amber-700" currency />
          </div>

          {/* المصاريف والأرباح */}
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>📊</span> الأرباح والمصاريف
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card label="إجمالي المصاريف" value={stats?.totalExpenses ?? 0} icon="💸" color="from-red-500 to-red-700" currency />
            <Card
              label="الربح التقديري"
              value={stats?.netProfit ?? 0}
              icon="📈"
              color={
                (stats?.netProfit ?? 0) >= 0 ? 'from-green-500 to-green-700' : 'from-red-500 to-red-700'
              }
              currency
              highlight
            />
            <Card label="زبائن جدد" value={stats?.customersAdded ?? 0} icon="👥" color="from-purple-500 to-purple-700" />
            <Card
              label="متوسط الطلب"
              value={
                stats?.ordersCount && stats.ordersCount > 0
                  ? Math.round((stats.totalSales || 0) / stats.ordersCount)
                  : 0
              }
              icon="📊"
              color="from-indigo-500 to-indigo-700"
              currency
            />
          </div>

          {/* Note */}
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 p-3 rounded-xl text-xs">
            ℹ️ الربح التقديري = المقبوضات − المصاريف. المبيعات ليست ربحاً صافياً حتى تُقبض.
          </div>
        </>
      )}
    </div>
  );
}

function getRange(period: Period) {
  const now = new Date();
  let from: Date, to: Date = new Date();

  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    const day = now.getDay();
    from = new Date(now);
    from.setDate(now.getDate() - day);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }

  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function Card({
  label,
  value,
  icon,
  color,
  currency,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  currency?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-4 ${
        highlight ? 'border-2 border-amber-300 ring-2 ring-amber-50' : 'border-gray-100'
      }`}
    >
      <div className={`bg-gradient-to-br ${color} text-white rounded-xl w-11 h-11 flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">
        {value?.toLocaleString('ar-IQ') ?? 0}
        {currency && <span className="text-xs text-gray-400 mr-1"> د.ع</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}