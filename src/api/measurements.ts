import { supabase } from '../lib/supabase';

export type Measurement = {
  id: string;
  tenant_id: string;
  customer_id: string;
  version: number;
  is_active: boolean;
  dishdasha_type: string | null;
  fabric_type: string | null;
  full_height: number | null;
  dishdasha_length: number | null;
  shoulder_width: number | null;
  sleeve_right: number | null;
  sleeve_left: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  neck: number | null;
  chest_width: number | null;
  upper_arm: number | null;
  wrist: number | null;
  armpit: number | null;
  custom_fields: Record<string, any>;
  cutting_notes: string | null;
  sewing_notes: string | null;
  measured_at: string;
  created_at: string;
};

export const listMeasurements = async (customerId: string) => {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('version', { ascending: false });
  if (error) throw error;
  return data as Measurement[];
};

export const getActiveMeasurement = async (customerId: string) => {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data as Measurement | null;
};

export const createMeasurement = async (input: Partial<Measurement> & { customer_id: string; tenant_id: string }) => {
  // احسب رقم النسخة
  const { data: existing } = await supabase
    .from('measurements')
    .select('version')
    .eq('customer_id', input.customer_id)
    .order('version', { ascending: false })
    .limit(1);

  const lastVersion = existing?.[0]?.version || 0;
  const newVersion = lastVersion + 1;

  // اجعل النسخ القديمة غير نشطة
  await supabase
    .from('measurements')
    .update({ is_active: false })
    .eq('customer_id', input.customer_id)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('measurements')
    .insert({
      ...input,
      version: newVersion,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Measurement;
};

export const deleteMeasurement = async (id: string) => {
  const { error } = await supabase
    .from('measurements')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
};

// حقول المقاسات القياسية
export const MEASUREMENT_FIELDS = [
  { key: 'full_height', label: 'الطول الكامل' },
  { key: 'dishdasha_length', label: 'طول الدشداشة' },
  { key: 'shoulder_width', label: 'عرض الكتف' },
  { key: 'sleeve_right', label: 'طول الكم الأيمن' },
  { key: 'sleeve_left', label: 'طول الكم الأيسر' },
  { key: 'chest', label: 'محيط الصدر' },
  { key: 'waist', label: 'محيط الخصر' },
  { key: 'hip', label: 'محيط الورك' },
  { key: 'neck', label: 'محيط الرقبة' },
  { key: 'chest_width', label: 'عرض الصدر' },
  { key: 'upper_arm', label: 'محيط العضد' },
  { key: 'wrist', label: 'محيط المعصم' },
  { key: 'armpit', label: 'مقاس الإبط' },
] as const;