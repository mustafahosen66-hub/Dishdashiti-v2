import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';

const EMAIL_DOMAIN = 'dishdashiti.app';

const phoneToEmail = (phone: string) => {
  const cleaned = phone.replace(/\s/g, '');
  return `${cleaned}@${EMAIL_DOMAIN}`;
};

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (phone.trim().length < 10) {
      setError('رقم الهاتف غير صحيح');
      setLoading(false);
      return;
    }

    try {
      const email = phoneToEmail(phone);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_credentials')
        ) {
          throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
        }
        throw signInError;
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="مرحباً بعودتك" subtitle="سجّل دخولك للمتابعة إلى حسابك">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            رقم الهاتف
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              📱
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
              placeholder="07700000000"
              dir="ltr"
              autoComplete="tel"
              className="w-full pl-12 pr-4 py-4 text-lg font-semibold tracking-wider bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition text-left"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            كلمة المرور
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔒
            </span>
            <input
              type={showPassword ? 'tel' : 'password'}
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
              placeholder="••••••••"
              dir="ltr"
              maxLength={8}
              autoComplete="current-password"
              className="w-full pl-12 pr-14 py-4 text-lg font-semibold tracking-widest bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition text-left"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition text-xl"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-4 rounded-2xl flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-brand-500/30 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              جارٍ الدخول...
            </>
          ) : (
            <>
              <span>تسجيل الدخول</span>
              <span>←</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400 font-medium">
            أو
          </span>
        </div>
      </div>

      {/* Register CTA */}
      <Link
        to="/register"
        className="block w-full text-center bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-2 border-emerald-200 text-emerald-800 py-4 rounded-2xl font-bold transition-all group"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <span>سجّل محلك مجاناً</span>
          <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            30 يوم
          </span>
        </span>
      </Link>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          بالمتابعة أنت توافق على{' '}
          <span className="text-brand-600 hover:underline cursor-pointer">شروط الاستخدام</span>
          {' '}و{' '}
          <span className="text-brand-600 hover:underline cursor-pointer">سياسة الخصوصية</span>
        </p>
      </div>
    </AuthLayout>
  );
}