import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  createMeasurement,
  getActiveMeasurement,
  MEASUREMENT_FIELDS,
  type Measurement,
} from '../api/measurements';

export default function NewMeasurement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tenant } = useAuth();
  const [error, setError] = useState('');

  const [form, setForm] = useState<Record<string, string>>({});
  const [dishdashaType, setDishdashaType] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [cuttingNotes, setCuttingNotes] = useState('');
  const [sewingNotes, setSewingNotes] = useState('');

  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('*').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: active } = useQuery({
    queryKey: ['measurement-active', id],
    queryFn: () => getActiveMeasurement(id!),
    enabled: !!id,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const data: any = {
        customer_id: id!,
        tenant_id: tenant!.id,
        dishdasha_type: dishdashaType || null,
        fabric_type: fabricType || null,
        cutting_notes: cuttingNotes || null,
        sewing_notes: sewingNotes || null,
      };
      MEASUREMENT_FIELDS.forEach((f) => {
        const v = form[f.key];
        data[f.key] = v ? Number(v) : null;
      });
      return createMeasurement(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['measurement-active', id] });
      navigate(`/customers/${id}`);
    },
    onError: (e: any) => setError(e.message || 'فشل الحفظ'),
  });

  const copyFromPrevious = () => {
    if (!active) return;
    const newForm: Record<string, string> = {};
    MEASUREMENT_FIELDS.forEach((f) => {
      const v = active[f.key as keyof Measurement];
      if (v != null) newForm[f.key] = String(v);
    });
    setForm(newForm);
    if (active.dishdasha_type) setDishdashaType(active.dishdasha_type);
    if (active.fabric_type) setFabricType(active.fabric_type);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const filled = Object.values(form).filter((v) => v && v.trim() !== '');
    if (filled.length < 3) return setError('أدخل 3 قيم على الأقل');
    saveMut.mutate();
  };

  if (!customer) return <div className="p-8 text-center text-gray-400">جارٍ التحميل...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/customers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium mb-3"
      >
        ← رجوع لملف الزبون
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-6 mb-5 text-white shadow">
        <h1 className="text-2xl font-bold">📏 مقاس جديد</h1>
        <p className="text-brand-100 text-sm mt-1">
          للزبون: <span className="font-semibold">{customer.full_name}</span>
          {active && (
            <span className="mr-3 text-xs bg-white/20 px-2 py-0.5 rounded">
              النسخة السابقة #{active.version}
            </span>
          )}
        </p>
        {active && (
          <button
            type="button"
            onClick={copyFromPrevious}
            className="mt-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition"
          >
            📋 نسخ من المقاس السابق
          </button>
        )}
      </div>

      {active && (
        <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 p-3 rounded-xl mb-5 text-sm">
          ℹ️ النسخة الحالية #{active.version} ستبقى محفوظة. سيتم إنشاء نسخة جديدة.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* نوع الدشداشة والقماش */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">نوع الدشداشة</label>
            <input
              type="text"
              value={dishdashaType}
              onChange={(e) => setDishdashaType(e.target.value)}
              placeholder="صيفي، شتوي، عراقي..."
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">نوع القماش</label>
            <input
              type="text"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              placeholder="قطن، حرير، صوف..."
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* المقاسات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">المقاسات (سم)</h3>
            <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-bold">
              {Object.values(form).filter((v) => v && v.trim() !== '').length} / {MEASUREMENT_FIELDS.length}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MEASUREMENT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder="—"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center font-semibold focus:border-brand-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* الملاحظات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">✂️ ملاحظات القص</label>
            <textarea
              value={cuttingNotes}
              onChange={(e) => setCuttingNotes(e.target.value)}
              rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="اختياري"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">🧵 ملاحظات الخياطة</label>
            <textarea
              value={sewingNotes}
              onChange={(e) => setSewingNotes(e.target.value)}
              rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="اختياري"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-2xl shadow border border-gray-100">
          <Link
            to={`/customers/${id}`}
            className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="px-6 py-3 rounded-xl bg-gradient-to-l from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white font-bold text-sm shadow disabled:opacity-60 transition"
          >
            {saveMut.isPending ? '⏳ جارٍ الحفظ...' : '💾 حفظ المقاس'}
          </button>
        </div>
      </form>
    </div>
  );
}