import { supabase } from '../lib/supabase';

export type OrderStatus =
  | 'new' | 'measured' | 'cutting' | 'sewing'
  | 'ironing' | 'ready' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string;
  measurement_id: string | null;
  order_date: string;
  delivery_date: string | null;
  quantity: number;
  dishdasha_type: string | null;
  fabric_type: string | null;
  fabric_color: string | null;
  design_notes: string | null;
  unit_price: number;
  total_price: number;
  discount: number;
  final_price: number;
  deposit: number;
  remaining: number;
  status: OrderStatus;
  employee_id: string | null;
  tailor_id: string | null;
  notes: string | null;
  created_at: string;
  customer?: { id: string; full_name: string; phone: string; customer_number: string };
};

export const ORDER_STATUSES: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'new', label: 'طلب جديد', color: 'bg-blue-100 text-blue-700' },
  { key: 'measured', label: 'تم أخذ المقاسات', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'cutting', label: 'قيد القص', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'sewing', label: 'قيد الخياطة', color: 'bg-amber-100 text-amber-700' },
  { key: 'ironing', label: 'قيد الكي', color: 'bg-orange-100 text-orange-700' },
  { key: 'ready', label: 'جاهز للتسليم', color: 'bg-green-100 text-green-700' },
  { key: 'delivered', label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-700' },
];

export const listOrders = async (filter?: { status?: OrderStatus; search?: string }) => {
  let q = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, phone, customer_number)')
    .order('created_at', { ascending: false });

  if (filter?.status) q = q.eq('status', filter.status);

  const { data, error } = await q;
  if (error) throw error;

  let orders = (data || []) as Order[];
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(s) ||
        o.customer?.full_name.toLowerCase().includes(s) ||
        o.customer?.phone.includes(s)
    );
  }
  return orders;
};

export const getOrder = async (id: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const getNextOrderNumber = async (tenantId: string) => {
  const year = new Date().getFullYear();
  const prefix = `DSH-${year}-`;
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .eq('tenant_id', tenantId)
    .like('order_number', `${prefix}%`)
    .order('order_number', { ascending: false })
    .limit(1);
  const last = data?.[0]?.order_number;
  const n = last ? Number(last.split('-').pop()) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
};

export const createOrder = async (input: any) => {
  const { data, error } = await supabase.from('orders').insert(input).select().single();
  if (error) throw error;
  return data as Order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus, tenantId: string, notes?: string) => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
  await supabase.from('order_status_history').insert({
    tenant_id: tenantId,
    order_id: id,
    status,
    notes: notes || null,
  });
};

export const addPayment = async (input: {
  tenant_id: string;
  order_id: string;
  amount: number;
  method?: string;
  notes?: string;
  current_deposit: number;
  final_price: number;
}) => {
  const newDeposit = input.current_deposit + input.amount;
  const newRemaining = input.final_price - newDeposit;

  const { error: payErr } = await supabase.from('payments').insert({
    tenant_id: input.tenant_id,
    order_id: input.order_id,
    amount: input.amount,
    method: input.method || 'cash',
    notes: input.notes || null,
  });
  if (payErr) throw payErr;

  const { error: ordErr } = await supabase
    .from('orders')
    .update({ deposit: newDeposit, remaining: newRemaining })
    .eq('id', input.order_id);
  if (ordErr) throw ordErr;
};

export const listPayments = async (orderId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return data;
};