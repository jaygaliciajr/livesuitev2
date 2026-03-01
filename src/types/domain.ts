export type DateFilter = "today" | "week" | "custom";

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";

export type LiveStatus = "active" | "ended";

export type GroupByMode = "customer" | "product";

export interface Supplier {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  product_code: string;
  category: string | null;
  size: string | null;
  price: number;
  stock: number;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface LiveSession {
  id: string;
  supplier_id: string;
  started_at: string;
  ended_at: string | null;
  status: LiveStatus;
  created_at: string;
}

export interface SessionOrder {
  id: string;
  session_id: string;
  customer_id: string;
  created_at: string;
}

export interface SessionOrderLine {
  id: string;
  session_order_id: string;
  product_id: string;
  qty: number;
  note: string | null;
  price_snapshot: number;
  line_total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  session_id: string;
  customer_id: string;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  created_at: string;
}

export interface LiveOrderRow {
  line_id: string;
  qty: number;
  note: string | null;
  line_total: number;
  created_at: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_code: string;
  price_snapshot: number;
}

export interface DashboardMetrics {
  totalPcs: number;
  totalInvoice: number;
  unpaidAmount: number;
  totalMiners: number;
}

export interface SessionSummary {
  distinctProductsSold: number;
  totalQuantitySold: number;
  totalSalesAmount: number;
  totalMiners: number;
  unpaidTotal: number;
}
