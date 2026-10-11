import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getActiveMeasurement, MEASUREMENT_FIELDS } from '../api/measurements';

export default function CustomerDetail() {
  const { id } = useParams();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: measurement } = useQuery({
    queryKey: ['measurement-active', id],
    queryFn: () => getActiveMeasurement(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">جارٍ التحميل...</div>;
  }

  if (!customer) {
    return (
      <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl">
        لم يتم العثور على الزبون.
        <Link to="/customers" className="block mt-2 text-sm underline">← رجوع</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          ← رجوع للزبائن
        </Link>
        <Link
          to={`/customers/${id}/measurements/new`}
          className="bg-gradient-to-l from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>{measurement ? 'مقاس جديد' : 'أضف مقاس'}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-6 mb-4 text-white shadow">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {customer.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{customer.full_name}</h2>
            <div className="text-brand-100 text-sm mt-1 font-mono">{customer.customer_number}</div>
            <div className="text-brand-100 text-sm mt-1 flex items-center gap-1">
              <span>📱</span> {customer.phone}
            </div>
          </div>
          <a
            href={`https://wa.me/${customer.phone.replace(/^0/, '964')}`}
            target="_blank"
            rel="noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition hidden sm:block"
          >
            💬 واتساب
          </a>
        </div>

        {(customer.governorate || customer.address || customer.notes) && (
          <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row gap-3 text-sm text-brand-100">
            {customer.governorate && <div>📍 {customer.governorate}</div>}
            {customer.address && <div>🏠 {customer.address}</div>}
            {customer.notes && <div>📝 {customer.notes}</div>}
          </div>
        )}
      </div>

      {/* Measurements */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span>📏</span> المقاسات الحالية
          </h3>
          {measurement && (
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-lg font-medium">
              نسخة #{measurement.version}
            </span>
          )}
        </div>

        {!measurement ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 opacity-30">📏</div>
            <p className="text-gray-400 text-sm mb-3">لا يوجد مقاسات محفوظة</p>
            <Link
              to={`/customers/${id}/measurements/new`}
              className="inline-block bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-100"
            >
              + أضف أول مقاس
            </Link>
          </div>
        ) : (
          <>
            {/* معلومات المقاس */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              {measurement.dishdasha_type && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">نوع الدشداشة</div>
                  <div className="font-semibold">{measurement.dishdasha_type}</div>
                </div>
              )}
              {measurement.fabric_type && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">نوع القماش</div>
                  <div className="font-semibold">{measurement.fabric_type}</div>
                </div>
              )}
            </div>

            {/* المقاسات القياسية */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MEASUREMENT_FIELDS.map((f) => {
                const val = measurement[f.key as keyof typeof measurement];
                if (val == null) return null;
                return (
                  <div
                    key={f.key}
                    className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <span className="text-xs text-gray-600">{f.label}</span>
                    <span className="font-bold text-brand-700">{val} <span className="text-[10px] text-gray-400">سم</span></span>
                  </div>
                );
              })}
            </div>

            {/* الحقول المخصصة */}
            {measurement.custom_fields && Object.keys(measurement.custom_fields).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-2">حقول مخصصة:</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(measurement.custom_fields).map(([k, v]) => (
                    <div key={k} className="flex justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-600">{k}</span>
                      <span className="font-bold text-brand-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الملاحظات */}
            {(measurement.cutting_notes || measurement.sewing_notes) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {measurement.cutting_notes && (
                  <div className="text-sm">
                    <span className="text-xs text-gray-500">✂️ ملاحظات القص: </span>
                    <span className="text-gray-700">{measurement.cutting_notes}</span>
                  </div>
                )}
                {measurement.sewing_notes && (
                  <div className="text-sm">
                    <span className="text-xs text-gray-500">🧵 ملاحظات الخياطة: </span>
                    <span className="text-gray-700">{measurement.sewing_notes}</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-gray-400 mt-4 text-center">
              تاريخ أخذ المقاس: {new Date(measurement.measured_at).toLocaleDateString('ar-IQ')}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 p-3 rounded-xl text-sm">
        <div className="font-semibold mb-1">📝 معلومات</div>
        <div className="text-xs">
          لحفظ مقاس جديد، اضغط "مقاس جديد". النسخة الحالية ستبقى محفوظة في السجل.
        </div>
      </div>
    </div>
  );
}