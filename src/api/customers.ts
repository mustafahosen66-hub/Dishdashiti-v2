import { supabase } from '../lib/supabase';

export type Customer = {
  id: string;
  tenant_id: string;
  customer_number: string;
  full_name: string;
  phone: string;
  address: string | null;
  governorate: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
};

export const listCustomers = async (search?: string) => {
  let q = supabase.from('customers').select('*').eq('is_archived', false).order('created_at', { ascending: false });
  if (search) {
    q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,customer_number.ilike.%${search}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data as Customer[];
};

export const createCustomer = async (input: {
  full_name: string;
  phone: string;
  address?: string;
  governorate?: string;
  notes?: string;
  customer_number: string;
  tenant_id: string;
}) => {
  const { data, error } = await supabase.from('customers').insert(input).select().single();
  if (error) throw error;
  return data as Customer;
};

export const updateCustomer = async (id: string, input: Partial<Customer>) => {
  const { data, error } = await supabase.from('customers').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Customer;
};

export const archiveCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').update({ is_archived: true }).eq('id', id);
  if (error) throw error;
};

export const getNextCustomerNumber = async (tenantId: string) => {
  const year = new Date().getFullYear();
  const prefix = `CUS-${year}-`;

  // عدد الزبائن النشطين الحاليين
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_archived', false);

  const n = (count ?? 0) + 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
};