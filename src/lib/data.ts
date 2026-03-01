import { supabase } from "@/lib/supabase";
import {
  Customer,
  DashboardMetrics,
  Invoice,
  LiveOrderRow,
  LiveSession,
  Payment,
  Product,
  SessionSummary,
  Supplier,
} from "@/types/domain";

function missingEnvError() {
  throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

function guardSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingEnvError();
  }
}

export async function listSuppliers(search = "") {
  guardSupabase();
  let query = supabase.from("suppliers").select("*").order("name", { ascending: true });
  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function createSupplier(name: string, notes?: string) {
  guardSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ name: name.trim(), notes: notes?.trim() || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: string, payload: { name: string; notes?: string }) {
  guardSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .update({ name: payload.name.trim(), notes: payload.notes?.trim() || null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: string) {
  guardSupabase();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

export async function listProducts(supplierId?: string, search = "") {
  guardSupabase();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (search.trim()) query = query.ilike("product_code", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function createProduct(payload: {
  supplier_id: string;
  product_code: string;
  stock: number;
  category?: string;
  price: number;
  size?: string;
  photo_url?: string;
}) {
  guardSupabase();
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...payload,
      product_code: payload.product_code.trim().toUpperCase(),
      category: payload.category?.trim() || null,
      size: payload.size?.trim() || null,
      photo_url: payload.photo_url?.trim() || null,
      is_active: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, payload: { stock: number; price: number }) {
  guardSupabase();
  const { data, error } = await supabase
    .from("products")
    .update({ stock: payload.stock, price: payload.price })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  guardSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function setActiveProduct(supplierId: string, productId: string) {
  guardSupabase();
  const { error: clearError } = await supabase.from("products").update({ is_active: false }).eq("supplier_id", supplierId);
  if (clearError) throw clearError;

  const { data, error } = await supabase.from("products").update({ is_active: true }).eq("id", productId).select("*").single();
  if (error) throw error;
  return data as Product;
}

export async function listCustomers(search = "") {
  guardSupabase();
  let query = supabase.from("customers").select("*").order("full_name", { ascending: true });
  if (search.trim()) query = query.ilike("full_name", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function createCustomer(name: string, phone?: string) {
  guardSupabase();
  const { data, error } = await supabase
    .from("customers")
    .insert({ full_name: name.trim(), phone: phone?.trim() || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, payload: { full_name: string; phone?: string }) {
  guardSupabase();
  const { data, error } = await supabase
    .from("customers")
    .update({ full_name: payload.full_name.trim(), phone: payload.phone?.trim() || null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function deleteCustomer(id: string) {
  guardSupabase();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function findOrCreateCustomer(name: string) {
  guardSupabase();
  const cleaned = name.trim();
  const { data, error } = await supabase.from("customers").select("*").ilike("full_name", cleaned).limit(1).maybeSingle();
  if (error) throw error;
  if (data) return data as Customer;
  return createCustomer(cleaned);
}

export async function getOrStartLiveSession(supplierId: string) {
  guardSupabase();
  const { data: activeSession, error: activeError } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeError) throw activeError;
  if (activeSession) return activeSession as LiveSession;

  const { data, error } = await supabase
    .from("live_sessions")
    .insert({ supplier_id: supplierId, status: "active", started_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as LiveSession;
}

export async function endLiveSession(sessionId: string) {
  guardSupabase();
  const endedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("live_sessions")
    .update({ status: "ended", ended_at: endedAt })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as LiveSession;
}

export async function addMinerLine(payload: { sessionId: string; customerId: string; productId: string; qty: number; note?: string }) {
  guardSupabase();
  const { data, error } = await supabase.rpc("add_miner_line", {
    p_session_id: payload.sessionId,
    p_customer_id: payload.customerId,
    p_product_id: payload.productId,
    p_qty: payload.qty,
    p_note: payload.note?.trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function updateMinerLineQty(lineId: string, qty: number) {
  guardSupabase();
  const { data, error } = await supabase.rpc("update_miner_line_qty", {
    p_line_id: lineId,
    p_new_qty: qty,
  });
  if (error) throw error;
  return data;
}

export async function removeMinerLine(lineId: string) {
  guardSupabase();
  const { error } = await supabase.rpc("delete_miner_line", { p_line_id: lineId });
  if (error) throw error;
}

export async function listSessionOrderRows(sessionId: string, search = "") {
  guardSupabase();
  const { data, error } = await supabase
    .from("session_order_lines")
    .select(
      "id, qty, note, line_total, created_at, price_snapshot, session_orders!inner(id, customer_id, customers!inner(id, full_name)), products!inner(id, product_code)",
    )
    .eq("session_orders.session_id", sessionId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((item: any) => ({
    line_id: item.id,
    qty: item.qty,
    note: item.note,
    line_total: Number(item.line_total),
    created_at: item.created_at,
    customer_id: item.session_orders.customer_id,
    customer_name: item.session_orders.customers.full_name,
    product_id: item.products.id,
    product_code: item.products.product_code,
    price_snapshot: Number(item.price_snapshot),
  })) as LiveOrderRow[];

  if (!search.trim()) return rows;
  const q = search.toLowerCase();
  return rows.filter((row) => row.customer_name.toLowerCase().includes(q) || row.product_code.toLowerCase().includes(q));
}

export async function generateDraftInvoices(sessionId: string) {
  guardSupabase();
  const { data, error } = await supabase.rpc("generate_draft_invoices", { p_session_id: sessionId });
  if (error) throw error;
  return data;
}

export async function listInvoices() {
  guardSupabase();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, customers(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Invoice & { customers?: { full_name: string } }>;
}

export async function updateInvoicePayment(invoiceId: string, paidAmount: number) {
  guardSupabase();
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (fetchError) throw fetchError;

  const capped = Math.max(0, Math.min(Number(invoice.total_amount), paidAmount));
  const nextStatus = capped === 0 ? "UNPAID" : capped >= Number(invoice.total_amount) ? "PAID" : "PARTIAL";

  const { data, error } = await supabase
    .from("invoices")
    .update({ paid_amount: capped, status: nextStatus })
    .eq("id", invoiceId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function listPayments() {
  guardSupabase();
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(total_amount, customers(full_name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Payment & { invoices?: { total_amount: number; customers?: { full_name: string } } }>;
}

export async function addPayment(payload: { invoice_id: string; amount: number; method: string; reference?: string }) {
  guardSupabase();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      invoice_id: payload.invoice_id,
      amount: payload.amount,
      method: payload.method,
      reference: payload.reference?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function getDashboardMetrics(fromIso: string, toIso: string): Promise<DashboardMetrics> {
  guardSupabase();
  const [{ data: linesData, error: linesError }, { data: invoicesData, error: invoicesError }] = await Promise.all([
    supabase
      .from("session_order_lines")
      .select("qty, session_orders!inner(customer_id, live_sessions!inner(started_at))")
      .gte("session_orders.live_sessions.started_at", fromIso)
      .lte("session_orders.live_sessions.started_at", toIso),
    supabase.from("invoices").select("total_amount, paid_amount, created_at, customer_id").gte("created_at", fromIso).lte("created_at", toIso),
  ]);

  if (linesError) throw linesError;
  if (invoicesError) throw invoicesError;

  const totalPcs = (linesData ?? []).reduce((sum: number, line: any) => sum + Number(line.qty || 0), 0);

  const customerSet = new Set<string>();
  (linesData ?? []).forEach((line: any) => {
    const customerId = line.session_orders?.customer_id;
    if (customerId) customerSet.add(customerId);
  });

  const totalInvoice = (invoicesData ?? []).reduce((sum: number, invoice: any) => sum + Number(invoice.total_amount || 0), 0);
  const unpaidAmount = (invoicesData ?? []).reduce(
    (sum: number, invoice: any) => sum + Math.max(Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0), 0),
    0,
  );

  return {
    totalPcs,
    totalInvoice,
    unpaidAmount,
    totalMiners: customerSet.size,
  };
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
  guardSupabase();
  const rows = await listSessionOrderRows(sessionId);

  const distinctProducts = new Set(rows.map((item) => item.product_id));
  const miners = new Set(rows.map((item) => item.customer_id));

  const totalQuantity = rows.reduce((sum, row) => sum + row.qty, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.line_total, 0);

  return {
    distinctProductsSold: distinctProducts.size,
    totalQuantitySold: totalQuantity,
    totalSalesAmount: totalSales,
    totalMiners: miners.size,
    unpaidTotal: totalSales,
  };
}

export async function listLiveSessions() {
  guardSupabase();
  const { data, error } = await supabase
    .from("live_sessions")
    .select("*, suppliers(name)")
    .order("started_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function exportTableCsv(table: "suppliers" | "products" | "customers" | "invoices") {
  guardSupabase();
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return "empty\n";

  const headers = Object.keys(rows[0]);
  const csvRows = rows.map((row) =>
    headers.map((header) => JSON.stringify((row as Record<string, unknown>)[header] ?? "")).join(","),
  );
  return [headers.join(","), ...csvRows].join("\n");
}
