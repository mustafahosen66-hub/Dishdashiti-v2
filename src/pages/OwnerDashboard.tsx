import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type TenantRow = {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  plan: string;
  expires_at: string;
  is_blocked: boolean;
  is_owner: boolean;
  created_at: string;
  customers_count?: number;
  orders_count?: number;
  payments_total?: number;
};

const PRESETS = [
  { key: 'monthly', label: 'شهري', days: 30, price: 10000 },
  { key: '2months', label: 'شهرين', days: 60, price: 20000 },
  { key: '6months', label: '6 أشهر', days: 180, price: 55000 },
  { key: 'yearly', label: 'سنوي', days: 365, price: 100000 },
];

export default function OwnerDashboard() {
  const { tenant: myTenant } = useAuth();
  const qc = useQueryClient();
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState(30);
  const [customAmount, setCustomAmount] = useState(10000);
  const [search, setSearch] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['owner-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_owner', false)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const enriched: TenantRow[] = [];
      for (const t of data || []) {
        const [c, o] = await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id),
        ]);
        enriched.push({
          ...t,
          customers_count: c.count ?? 0,
          orders_count: o.count ?? 0,
        });
      }
      return enriched;
    },
    enabled: !!myTenant?.is_owner,
  });

  const extendMut = useMutation({
    mutationFn: async (data: { tenantId: string; days: number; amount: number }) => {
      const current = tenants?.find((t) => t.id === data.tenantId);
      const base =
        current && new Date(current.expires_at) > new Date()
          ? new Date(current.expires_at)
          : new Date();
      const newExpiry = new Date(base);
      newExpiry.setDate(newExpiry.getDate() + data.days);

      // سجّل الدفعة
      await supabase.from('subscription_payments').insert({
        tenant_id: data.tenantId,
        amount: data.amount,
        plan: 'custom',
        days_added: data.days,
        payment_method: 'manual',
      });

      // مدّد الاشتراك
      const { error } = await supabase
        .from('tenants')
        .update({
          expires_at: newExpiry.toISOString(),
          is_blocked: false,
        })
        .eq('id', data.tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-tenants'] });
      setExtendingId(null);
    },
  });

  const blockMut = useMutation({
    mutationFn: async (data: { tenantId: string; blocked: boolean }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_blocked: data.blocked })
        .eq('id', data.tenantId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-tenants'] }),
  });

  const daysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const statusBadge = (t: TenantRow) => {
    const days = daysRemaining(t.expires_at);
    if (t.is_blocked) return { label: 'محظور', color: 'bg-red-100 text-red-700' };
    if (days < 0) return { label: 'منتهي', color: 'bg-red-100 text-red-700' };
    if (days <= 7) return { label: `${days} أيام`, color: 'bg-amber-100 text-amber-700' };
    if (t.plan === 'trial') return { label: 'تجريبي', color: 'bg-blue-100 text-blue-700' };
    return { label: 'نشط', color: 'bg-emerald-100 text-emerald-700' };
  };

  const openExtend = (tenantId: string, currentDays: number) => {
    setExtendingId(tenantId);
    // اقترح 30 يوم/10,000 افتراضياً
    setCustomDays(30);
    setCustomAmount(10000);
  };

  const filtered = (tenants || []).filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search) : true
  );

  const activeCount = tenants?.filter((t) => !t.is_blocked && daysRemaining(t.expires_at) > 0).length || 0;
  const expiredCount = tenants?.filter((t) => daysRemaining(t.expires_at) < 0).length || 0;
  const totalCustomers = tenants?.reduce((s, t) => s + (t.customers_count || 0), 0) || 0;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-700 to-purple-900 rounded-2xl p-6 mb-6 text-white shadow">
        <h1 className="text-2xl font-bold">👑 لوحة مالك النظام</h1>
        <p className="text-purple-100 text-sm mt-1">إدارة كل المحلات المشتركة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="إجمالي المحلات" value={tenants?.length || 0} icon="🏪" grad="from-blue-500 to-blue-700" />
        <StatCard label="مشترك فعّال" value={activeCount} icon="✅" grad="from-emerald-500 to-emerald-700" />
        <StatCard label="منتهي/محظور" value={expiredCount} icon="⚠️" grad="from-red-500 to-red-700" />
        <StatCard label="إجمالي الزبائن" value={totalCustomers} icon="👥" grad="from-teal-500 to-teal-700" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المحل أو رقم الهاتف..."
            className="w-full border-2 border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">🏪 المحلات المسجلة</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>
        ) : !filtered.length ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-3 opacity-30">🏪</div>
            <p className="text-gray-500">لا يوجد محلات مسجلة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((t) => {
              const st = statusBadge(t);
              const days = daysRemaining(t.expires_at);
              const isExtending = extendingId === t.id;
              return (
                <div key={t.id} className={`p-4 ${t.is_blocked ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    {/* معلومات المحل */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-800 truncate">{t.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t.owner_name} • {t.phone}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                          <span>👥 {t.customers_count} زبون</span>
                          <span>📋 {t.orders_count} طلب</span>
                          <span
                            className={
                              days < 0
                                ? 'text-red-600 font-bold'
                                : days <= 7
                                ? 'text-amber-600 font-bold'
                                : ''
                            }
                          >
                            {days < 0
                              ? `انتهى منذ ${Math.abs(days)} يوم`
                              : `${days} يوم متبقٍ`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isExtending ? (
                        <div className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                          {/* Presets */}
                          <div className="text-xs font-semibold text-emerald-900 mb-2">
                            اختر بسرعة:
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {PRESETS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => {
                                  setCustomDays(p.days);
                                  setCustomAmount(p.price);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition border ${
                                  customDays === p.days && customAmount === p.price
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                {p.label} — {p.price.toLocaleString()}
                              </button>
                            ))}
                          </div>

                          {/* Custom inputs */}
                          <div className="text-xs font-semibold text-emerald-900 mb-2">
                            أو حدد يدوياً:
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-[10px] text-emerald-800 mb-1">
                                عدد الأيام
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={customDays}
                                onChange={(e) => setCustomDays(Number(e.target.value))}
                                className="w-full border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm font-bold text-center bg-white focus:border-emerald-600 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-emerald-800 mb-1">
                                المبلغ (د.ع)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(Number(e.target.value))}
                                className="w-full border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm font-bold text-center bg-white focus:border-emerald-600 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="bg-white rounded-lg p-2 mb-3 text-xs text-center text-emerald-900">
                            <span className="font-bold">{customDays}</span> يوم مقابل{' '}
                            <span className="font-bold">{customAmount.toLocaleString()}</span> د.ع
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                extendMut.mutate({
                                  tenantId: t.id,
                                  days: customDays,
                                  amount: customAmount,
                                })
                              }
                              disabled={
                                extendMut.isPending || customDays < 1 || customAmount < 0
                              }
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-bold disabled:opacity-60"
                            >
                              {extendMut.isPending ? '⏳...' : '✓ تأكيد التمديد'}
                            </button>
                            <button
                              onClick={() => setExtendingId(null)}
                              className="bg-white text-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-300"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openExtend(t.id, days)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-lg font-bold"
                          >
                            💳 تمديد
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  t.is_blocked
                                    ? `رفع الحظر عن ${t.name}؟`
                                    : `حظر ${t.name}؟`
                                )
                              )
                                blockMut.mutate({ tenantId: t.id, blocked: !t.is_blocked });
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                              t.is_blocked
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {t.is_blocked ? '✅ رفع الحظر' : '🚫 حظر'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  grad,
  currency,
}: {
  label: string;
  value: number;
  icon: string;
  grad: string;
  currency?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div
        className={`bg-gradient-to-br ${grad} text-white rounded-xl w-11 h-11 flex items-center justify-center text-xl mb-3`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">
        {value?.toLocaleString() || 0}
        {currency && <span className="text-xs text-gray-400 mr-1"> د.ع</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}