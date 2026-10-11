import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';

const EMAIL_DOMAIN = 'dishdashiti.app';

const isValidIraqiPhone = (phone: string) => {
  return /^07\d{9}$/.test(phone.replace(/\s/g, ''));
};

const phoneToEmail = (phone: string) => {
  const cleaned = phone.replace(/\s/g, '');
  return `${cleaned}@${EMAIL_DOMAIN}`;
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    governorate: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateStep1 = () => {
    if (form.shopName.trim().length < 2) return 'اسم المحل مطلوب';
    if (form.ownerName.trim().length < 2) return 'اسمك مطلوب';
    return '';
  };

  const nextStep = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidIraqiPhone(form.phone)) {
      return setError('رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقماً');
    }
    if (form.password.length !== 8) {
      return setError('كلمة المرور يجب أن تكون 8 أرقام بالضبط');
    }
    if (form.password !== form.confirmPassword) {
      return setError('كلمتا المرور غير متطابقتين');
    }

    setLoading(true);
    try {
      const email = phoneToEmail(form.phone);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            shop_name: form.shopName,
            owner_name: form.ownerName,
            phone: form.phone.replace(/\s/g, ''),
            governorate: form.governorate || '',
            address: form.address || '',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('رقم الهاتف مستخدم مسبقاً. سجّل دخولك.');
        }
        throw signUpError;
      }
      if (!data.user) throw new Error('لم يتم إنشاء الحساب');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء المحل');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #2a1f10 0%, #4a361c 50%, #6b4e26 100%)',
        }}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-4xl shadow-lg">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">مبروك!</h1>
          <p className="text-gray-600 mb-6">
            تم إنشاء محل <span className="font-bold text-brand-700">"{form.shopName}"</span> بنجاح
          </p>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 text-emerald-900 p-5 rounded-2xl mb-5">
            <div className="text-2xl mb-2">🎁</div>
            <div className="font-bold mb-1">30 يوماً تجريبية مجانية</div>
            <div className="text-xs">بعدها الاشتراك الشهري 10,000 د.ع</div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 text-blue-900 p-4 rounded-2xl mb-3">
            <div className="text-xs font-semibold mb-1">📱 رقم دخولك</div>
            <div className="font-mono text-2xl font-bold tracking-wider" dir="ltr">
              {form.phone}
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-4 rounded-2xl mb-5">
            <div className="text-xs font-semibold mb-1">🔐 كلمة مرورك</div>
            <div className="font-mono text-2xl font-bold tracking-widest" dir="ltr">
              {form.password}
            </div>
            <div className="text-[10px] mt-1 opacity-70">احفظها في مكان آمن</div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-brand-700 to-brand-800 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition"
          >
            → اذهب لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="سجّل محلك الآن"
      subtitle="30 يوماً تجريبية مجانية — بدون بطاقة ائتمان"
    >
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-brand-600' : 'bg-gray-200'}`}></div>
        <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`}></div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المحل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🏪</span>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="محل النور للدشداشة"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسمك الكامل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="علي حسين محمد"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">المحافظة</label>
                <input
                  type="text"
                  value={form.governorate}
                  onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                  placeholder="بغداد"
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="الكرادة"
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-4 rounded-2xl flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={nextStep}
              className="w-full bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-500/30 transition flex items-center justify-center gap-2"
            >
              <span>التالي</span>
              <span>←</span>
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📱</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, '').slice(0, 11) })}
                  placeholder="07700000000"
                  dir="ltr"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 text-lg font-semibold tracking-wider bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition text-left"
                />
              </div>
              <div className="text-[11px] text-gray-400 mt-1.5 text-center">
                هذا رقم دخولك للنظام — احفظه جيداً
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 mr-2 font-normal">(8 أرقام)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔐</span>
                <input
                  type={showPassword ? 'tel' : 'password'}
                  inputMode="numeric"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value.replace(/[^\d]/g, '').slice(0, 8) })}
                  placeholder="••••••••"
                  dir="ltr"
                  maxLength={8}
                  className="w-full pl-12 pr-14 py-4 text-lg font-semibold tracking-widest bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition text-left"
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
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      i < form.password.length ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تأكيد كلمة المرور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">✓</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value.replace(/[^\d]/g, '').slice(0, 8) })}
                  placeholder="••••••••"
                  dir="ltr"
                  maxLength={8}
                  className="w-full pl-12 pr-4 py-4 text-lg font-semibold tracking-widest bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white transition text-left"
                />
              </div>
              {form.confirmPassword.length > 0 && (
                <div className="text-xs mt-1.5 text-center">
                  {form.password === form.confirmPassword ? (
                    <span className="text-emerald-600 font-bold">✓ متطابق</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗ غير متطابق</span>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-4 rounded-2xl flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition"
              >
                → السابق
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-500/30 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    جارٍ التسجيل...
                  </>
                ) : (
                  <>
                    <span>🎉 ابدأ الآن</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-brand-700 hover:underline font-bold">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}