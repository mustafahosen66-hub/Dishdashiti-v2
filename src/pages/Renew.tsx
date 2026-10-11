import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_PHONE = '07777000096';

const PLANS = [
  {
    key: 'monthly',
    label: 'شهري',
    days: 30,
    price: 10000,
    popular: false,
    features: ['استخدام كامل', 'دعم فني'],
  },
  {
    key: 'yearly',
    label: 'سنوي',
    days: 365,
    price: 100000,
    popular: true,
    features: ['كل ميزات الشهري', 'وفّر 20,000 د.ع', 'تحديثات مجانية', 'دعم أولوية'],
  },
];

export default function Renew() {
  const { profile, tenant, daysLeft } = useAuth();
  const [copied, setCopied] = useState('');
  const [selected, setSelected] = useState('yearly');

  const plan = PLANS.find((p) => p.key === selected)!;

  const copyPhone = () => {
    navigator.clipboard.writeText(PAYMENT_PHONE);
    setCopied('phone');
    setTimeout(() => setCopied(''), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً،\n` +
      `أريد تجديد اشتراك محل: "${tenant?.name || ''}"\n\n` +
      `الخطة: ${plan.label} (${plan.price.toLocaleString()} د.ع / ${plan.days} يوم)\n` +
      `هاتفي: ${profile?.phone || ''}\n\n` +
      `📎 صورة الإيصال في الأسفل ⬇️`
  );

  const days = daysLeft();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium mb-3"
      >
        ← رجوع
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-l from-amber-500 to-amber-700 rounded-2xl p-6 mb-6 text-white shadow">
        <div className="flex items-center gap-3">
          <div className="text-4xl">⏰</div>
          <div>
            <h1 className="text-2xl font-bold">تجديد الاشتراك</h1>
            <p className="text-amber-100 text-sm mt-1">
              {days > 0
                ? `تبقّى ${days} ${days === 1 ? 'يوم' : 'أيام'} في اشتراكك الحالي`
                : 'اشتراكك منتهٍ'}
            </p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-xl font-bold text-gray-800 mb-3">📦 اختر خطتك</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {PLANS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSelected(p.key)}
            className={`text-right rounded-2xl p-5 border-2 transition relative ${
              selected === p.key
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                : 'border-gray-200 bg-white hover:border-brand-300'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-4 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                ⭐ الأكثر توفيراً
              </div>
            )}
            <div className="flex items-center justify-between mt-1">
              <div className="text-2xl font-bold text-gray-800">{p.label}</div>
              {selected === p.key && <div className="text-brand-600 text-xl">✓</div>}
            </div>
            <div className="mt-2 mb-3">
              <span className="text-3xl font-bold text-brand-700">
                {p.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 mr-1">د.ع</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">
              ~{Math.round(p.price / p.days).toLocaleString()} د.ع / يوم
            </div>
            <ul className="text-xs space-y-1 text-gray-600">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Selected Plan Summary */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-brand-100 text-xs mb-1">الخطة المختارة</div>
            <div className="text-2xl font-bold">{plan.label}</div>
            <div className="text-brand-100 text-xs mt-1">صالح لمدة {plan.days} يوم</div>
          </div>
          <div className="text-left">
            <div className="text-brand-100 text-xs mb-1">المبلغ</div>
            <div className="text-4xl font-bold">{plan.price.toLocaleString()}</div>
            <div className="text-brand-100 text-xs">د.ع</div>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-4 rounded-xl mb-4 text-sm">
        <div className="font-bold mb-2">💳 كيف تُجدد؟</div>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>حوّل <span className="font-bold">{plan.price.toLocaleString()} د.ع</span> على الرقم أدناه</li>
          <li>استخدم ZainCash أو Qi Card</li>
          <li>أرسل صورة الإيصال على واتساب</li>
          <li>سيُفعّل اشتراكك خلال دقائق ⚡</li>
        </ol>
      </div>

      {/* QR Codes */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-center">
          <img
            src="/qr-zaincash.png"
            alt="ZainCash QR"
            className="w-40 h-40 mx-auto mb-3 border rounded-lg"
          />
          <div className="font-bold text-gray-800 mb-1">ZainCash</div>
          <div className="text-xs text-gray-500">امسح بتطبيق زين كاش</div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-center">
          <img
            src="/qr-qi.png"
            alt="Qi Card QR"
            className="w-40 h-40 mx-auto mb-3 border rounded-lg"
          />
          <div className="font-bold text-gray-800 mb-1">Qi Card</div>
          <div className="text-xs text-gray-500">امسح بتطبيق Qi Card</div>
        </div>
      </div>

      {/* Phone */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white mb-6">
        <div className="text-emerald-100 text-sm mb-1">📱 رقم الدفع</div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-mono text-3xl font-bold tracking-widest" dir="ltr">
            {PAYMENT_PHONE}
          </div>
          <button
            onClick={copyPhone}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            {copied === 'phone' ? '✅ تم' : '📋 انسخ'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <a
          href={`https://wa.me/964${PAYMENT_PHONE.slice(1)}?text=${whatsappMessage}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full bg-gradient-to-l from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold text-center shadow transition"
        >
          💬 أرسل الإيصال على واتساب
        </a>
        <Link
          to="/"
          className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm transition text-center"
        >
          لاحقاً
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
        📌 سيُفعّل اشتراكك خلال دقائق من استلام الإيصال.
      </div>
    </div>
  );
}