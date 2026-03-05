import { supabase } from "@/lib/supabase";
import {
  Customer,
  DashboardMetrics,
  Invoice,
  InvoiceListItem,
  InvoiceOrderLine,
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

export async function listCustomerBalances() {
  guardSupabase();
  const { data, error } = await supabase.from("invoices").select("customer_id, total_amount, paid_amount");
  if (error) throw error;

  const balances: Record<string, number> = {};
  (data ?? []).forEach((invoice: any) => {
    const customerId = invoice.customer_id as string;
    const unpaid = Math.max(Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0), 0);
    balances[customerId] = (balances[customerId] || 0) + unpaid;
  });
  return balances;
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

function parseVariantNote(note?: string | null) {
  if (!note) return { color: "", size: "", userNote: "" };
  if (!note.startsWith("variant:")) return { color: "", size: "", userNote: note };
  const raw = note.replace("variant:", "");
  const [color = "", size = "", userNote = ""] = raw.split("|");
  return { color, size, userNote };
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

export async function listInvoicesWithFilters(filters?: {
  from?: string;
  to?: string;
  supplierId?: string;
}) {
  guardSupabase();
  let query = supabase
    .from("invoices")
    .select("id, session_id, customer_id, total_amount, paid_amount, status, created_at, customers(full_name), live_sessions(supplier_id, suppliers(name))")
    .order("created_at", { ascending: false });

  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((item: any) => ({
    id: item.id,
    session_id: item.session_id,
    customer_id: item.customer_id,
    total_amount: Number(item.total_amount),
    paid_amount: Number(item.paid_amount),
    status: item.status,
    created_at: item.created_at,
    customer_name: item.customers?.full_name || "Unknown customer",
    supplier_id: item.live_sessions?.supplier_id || null,
    supplier_name: item.live_sessions?.suppliers?.name || "Unknown supplier",
  })) as InvoiceListItem[];

  if (filters?.supplierId) {
    return rows.filter((item) => item.supplier_id === filters.supplierId);
  }
  return rows;
}

export async function getInvoiceDetail(invoiceId: string) {
  guardSupabase();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*, customers(full_name, phone), live_sessions(supplier_id, suppliers(name), started_at)")
    .eq("id", invoiceId)
    .single();
  if (invoiceError) throw invoiceError;

  const { data: linesRaw, error: linesError } = await supabase
    .from("session_order_lines")
    .select("id, qty, line_total, note, products!inner(product_code, suppliers(name)), session_orders!inner(session_id, customer_id)")
    .eq("session_orders.session_id", invoice.session_id)
    .eq("session_orders.customer_id", invoice.customer_id)
    .order("created_at", { ascending: false });
  if (linesError) throw linesError;

  const lines = (linesRaw ?? []).map((row: any) => {
    const variant = parseVariantNote(row.note);
    return {
      line_id: row.id,
      product_code: row.products.product_code,
      supplier_name: row.products.suppliers?.name || "Unknown supplier",
      qty: Number(row.qty),
      amount: Number(row.line_total),
      color: variant.color,
      size: variant.size,
      note: variant.userNote,
    };
  }) as InvoiceOrderLine[];

  return {
    invoice: {
      id: invoice.id,
      session_id: invoice.session_id,
      customer_id: invoice.customer_id,
      total_amount: Number(invoice.total_amount),
      paid_amount: Number(invoice.paid_amount),
      status: invoice.status,
      created_at: invoice.created_at,
      customer_name: invoice.customers?.full_name || "Unknown customer",
      customer_phone: invoice.customers?.phone || "",
      supplier_name: invoice.live_sessions?.suppliers?.name || "Unknown supplier",
      live_started_at: invoice.live_sessions?.started_at || null,
    },
    lines,
  };
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

export async function listInvoiceAmountsInRange(fromIso: string, toIso: string) {
  guardSupabase();
  const { data, error } = await supabase
    .from("invoices")
    .select("created_at, total_amount")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    created_at: item.created_at as string,
    total_amount: Number(item.total_amount || 0),
  }));
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

export async function listLiveSessionsPaginated(page = 1, pageSize = 10) {
  guardSupabase();
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("live_sessions")
    .select("id, supplier_id, started_at, ended_at, status, created_at, suppliers(name)", { count: "exact" })
    .order("started_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const sessions = (data ?? []) as Array<LiveSession & { suppliers?: { name?: string | null } }>;
  const sessionIds = sessions.map((session) => session.id);
  if (sessionIds.length === 0) {
    return { items: [], total: count ?? 0 };
  }

  const { data: linesRaw, error: linesError } = await supabase
    .from("session_order_lines")
    .select("qty, line_total, session_orders!inner(session_id, customer_id)")
    .in("session_orders.session_id", sessionIds);
  if (linesError) throw linesError;

  const sessionMap = new Map<
    string,
    {
      totalAmount: number;
      totalPcs: number;
      customers: Set<string>;
      lines: number;
    }
  >();

  (linesRaw ?? []).forEach((row: any) => {
    const sessionId = row.session_orders?.session_id as string | undefined;
    if (!sessionId) return;

    const prev = sessionMap.get(sessionId) ?? {
      totalAmount: 0,
      totalPcs: 0,
      customers: new Set<string>(),
      lines: 0,
    };

    prev.totalAmount += Number(row.line_total || 0);
    prev.totalPcs += Number(row.qty || 0);
    prev.lines += 1;
    if (row.session_orders?.customer_id) prev.customers.add(row.session_orders.customer_id);

    sessionMap.set(sessionId, prev);
  });

  const items = sessions.map((session) => {
    const totals = sessionMap.get(session.id);
    return {
      ...session,
      suppliers: session.suppliers,
      total_amount: totals?.totalAmount ?? 0,
      total_pcs: totals?.totalPcs ?? 0,
      total_customers: totals?.customers.size ?? 0,
      total_lines: totals?.lines ?? 0,
    };
  });

  return {
    items,
    total: count ?? sessions.length,
  };
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
