import { supabase } from '../lib/supabase';

export type Expense = {
  id: string;
  tenant_id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
};

export const EXPENSE_CATEGORIES = [
  { key: 'fabric', label: 'قماش' },
  { key: 'salary', label: 'رواتب' },
  { key: 'rent', label: 'إيجار' },
  { key: 'electricity', label: 'كهرباء وماء' },
  { key: 'maintenance', label: 'صيانة' },
  { key: 'transport', label: 'نقل' },
  { key: 'supplies', label: 'مستلزمات' },
  { key: 'marketing', label: 'إعلانات' },
  { key: 'other', label: 'أخرى' },
];

export const listExpenses = async (params?: { from?: string; to?: string; category?: string }) => {
  let q = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  if (params?.from) q = q.gte('expense_date', params.from);
  if (params?.to) q = q.lte('expense_date', params.to);
  if (params?.category) q = q.eq('category', params.category);
  const { data, error } = await q;
  if (error) throw error;
  return data as Expense[];
};

export const createExpense = async (input: {
  tenant_id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date?: string;
}) => {
  const { data, error } = await supabase.from('expenses').insert(input).select().single();
  if (error) throw error;
  return data as Expense;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
};