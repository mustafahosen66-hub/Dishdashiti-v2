import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, tenant, signOut, daysLeft } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const links = tenant?.is_owner
  ? [
      { to: '/owner', label: 'لوحة المالك', icon: '👑' },
    ]
  : [
      { to: '/', label: 'لوحة التحكم', icon: '🏠' },
      { to: '/customers', label: 'الزبائن', icon: '👥' },
      { to: '/orders', label: 'الطلبات', icon: '📋' },
      { to: '/expenses', label: 'المصاريف', icon: '💸' },
      { to: '/reports', label: 'التقارير', icon: '📊' },
    ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const days = daysLeft();
  const showBanner = !tenant?.is_owner && days <= 7 && days >= 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Trial Banner */}
      {showBanner && (
        <div
          className={`text-white text-center py-2 px-4 text-sm font-bold ${
            days <= 3
              ? 'bg-gradient-to-l from-red-600 to-red-800'
              : 'bg-gradient-to-l from-amber-500 to-amber-700'
          }`}
        >
          {days === 0
            ? '⚠️ اشتراكك ينتهي اليوم!'
            : `⏰ تبقّى ${days} ${days === 1 ? 'يوم' : 'أيام'} من اشتراكك`}
          <Link
  to="/renew"
  className="mr-3 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs inline-block"
>
  💳 جدّد الآن
</Link>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden text-2xl text-gray-600 hover:text-brand-700"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xl shadow">
                🧵
              </div>
              <div>
                <h1 className="text-lg font-bold text-brand-800 leading-tight">
                  {tenant?.name || 'دشداشتي'}
                </h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">نظام إدارة الدشداشة</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0) || 'م'}
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-800 leading-tight">
                  {profile?.full_name || 'مستخدم'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {profile?.role === 'admin' ? 'المدير' : profile?.role === 'owner' ? 'مالك' : profile?.role}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1"
            >
              🚪 <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>

        <nav className="hidden md:block border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition border-b-2 ${
                  isActive(l.to)
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-600 hover:text-brand-600'
                }`}
              >
                <span className="ml-1.5">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        {mobileNav && (
          <nav className="md:hidden border-t border-gray-100 bg-gray-50">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileNav(false)}
                className={`block px-4 py-3 text-sm border-b border-gray-100 ${
                  isActive(l.to) ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700'
                }`}
              >
                <span className="ml-2">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">{children}</main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        نظام <span className="font-semibold text-brand-700">دشداشتي</span> © 2026
      </footer>
    </div>
  );
}