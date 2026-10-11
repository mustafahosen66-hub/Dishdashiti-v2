import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* اليمين: الفورم */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-white relative overflow-hidden">
        {/* Decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-3xl font-bold text-gray-900 mt-5 mb-2">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
          نظام <span className="font-semibold text-brand-700">دشداشتي</span> © 2026
        </div>
      </div>

      {/* اليسار: التسويق */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-400/40 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-300/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              نظام سحابي · آمن · سريع
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                أدر محل الدشداشة
                <br />
                <span className="text-amber-400">باحترافية</span>
              </h2>
              <p className="text-brand-100 text-lg leading-relaxed">
                نظام متكامل لإدارة الزبائن، المقاسات، الطلبات،
                <br />
                والمدفوعات — من أي جهاز، في أي مكان.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <Feature icon="👥" label="إدارة الزبائن" />
              <Feature icon="📏" label="المقاسات" />
              <Feature icon="📋" label="الطلبات" />
              <Feature icon="💳" label="المدفوعات" />
              <Feature icon="📊" label="التقارير" />
              <Feature icon="🖨️" label="الفواتير" />
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-brand-100">30 يوم مجاني</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-brand-100">بدون بطاقة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-brand-100">دعم بالعربية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-10 h-10 text-xl' : size === 'lg' ? 'w-20 h-20 text-4xl' : 'w-16 h-16 text-3xl';
  return (
    <div className="flex justify-center">
      <div
        className={`${s} rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center shadow-xl shadow-brand-500/30 ring-1 ring-white/20 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
        <span className="relative">🧵</span>
      </div>
    </div>
  );
}