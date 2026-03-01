"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  CircleCheck,
  Clock3,
  Crown,
  ListOrdered,
  PackagePlus,
  Play,
  Plus,
  Search,
  Sparkles,
  Upload,
  UserRoundPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  addMinerLine,
  createProduct,
  createSupplier,
  endLiveSession,
  findOrCreateCustomer,
  generateDraftInvoices,
  getOrStartLiveSession,
  getSessionSummary,
  listCustomerBalances,
  listCustomers,
  listProducts,
  listSessionOrderRows,
  listSuppliers,
  removeMinerLine,
  setActiveProduct,
  updateMinerLineQty,
} from "@/lib/data";
import { cn, formatCurrency, formatSeconds } from "@/lib/utils";
import { Customer, GroupByMode, LiveOrderRow, LiveSession, Product, SessionSummary, Supplier } from "@/types/domain";

const initialSummary: SessionSummary = {
  distinctProductsSold: 0,
  totalQuantitySold: 0,
  totalSalesAmount: 0,
  totalMiners: 0,
  unpaidTotal: 0,
};

const PRIORITY_ORDER = ["normal", "high", "vip"] as const;
type CustomerPriority = (typeof PRIORITY_ORDER)[number];

const COLOR_OPTIONS = ["Black", "White", "Red", "Blue", "Pink", "Green"];

export function LiveSpeedScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeProduct, setActiveProductState] = useState<Product | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [orderRows, setOrderRows] = useState<LiveOrderRow[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByMode>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const [supplierModal, setSupplierModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [summary, setSummary] = useState<SessionSummary>(initialSummary);

  const [newSupplier, setNewSupplier] = useState({ name: "", logoUrl: "" });
  const [newProduct, setNewProduct] = useState({
    product_code: "",
    stock: 1,
    category: "",
    price: "0",
    size: "",
    variantSizes: "",
    variantColors: "",
    photo_url: "",
  });

  const [customerForm, setCustomerForm] = useState({
    customerId: "",
    customerName: "",
    qty: 1,
    color: "",
    size: "",
    note: "",
  });
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({});

  const [supplierLogoMap, setSupplierLogoMap] = useState<Record<string, string>>({});
  const [productVariantMap, setProductVariantMap] = useState<Record<string, { sizes: string[]; colors: string[] }>>({});
  const [priorityMap, setPriorityMap] = useState<Record<string, CustomerPriority>>({});

  const lowStockThreshold = useMemo(() => {
    if (typeof window === "undefined") return 3;
    const stored = Number(window.localStorage.getItem("ls-low-stock-threshold") || "3");
    return Number.isFinite(stored) && stored > 0 ? stored : 3;
  }, []);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((item) => item.name.toLowerCase().includes(q));
  }, [supplierSearch, suppliers]);

  const visibleProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter((product) => product.product_code.toLowerCase().includes(q));
  }, [productSearch, products]);

  const enrichedRows = useMemo(
    () =>
      orderRows.map((row) => {
        const parsed = parseVariantNote(row.note);
        const priority = priorityMap[row.customer_id] ?? "normal";
        return { ...row, ...parsed, priority };
      }),
    [orderRows, priorityMap],
  );

  const groupedRows = useMemo(() => {
    const groups = new Map<string, typeof enrichedRows>();
    enrichedRows.forEach((row) => {
      const key = groupBy === "customer" ? row.customer_name : row.product_code;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(row);
    });
    return [...groups.entries()];
  }, [groupBy, enrichedRows]);

  const totalsByCustomer = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>();
    enrichedRows.forEach((row) => {
      const prev = map.get(row.customer_id) ?? { qty: 0, amount: 0 };
      map.set(row.customer_id, { qty: prev.qty + row.qty, amount: prev.amount + row.line_total });
    });
    return map;
  }, [enrichedRows]);

  const totalsByProduct = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>();
    enrichedRows.forEach((row) => {
      const prev = map.get(row.product_id) ?? { qty: 0, amount: 0 };
      map.set(row.product_id, { qty: prev.qty + row.qty, amount: prev.amount + row.line_total });
    });
    return map;
  }, [enrichedRows]);

  useEffect(() => {
    void loadSuppliers();
    void loadBalances();

    if (typeof window !== "undefined") {
      setOnline(navigator.onLine);
      const logosRaw = window.localStorage.getItem("ls-supplier-logos");
      const variantsRaw = window.localStorage.getItem("ls-product-variants");
      const prioritiesRaw = window.localStorage.getItem("ls-customer-priorities");

      if (logosRaw) setSupplierLogoMap(JSON.parse(logosRaw));
      if (variantsRaw) setProductVariantMap(JSON.parse(variantsRaw));
      if (prioritiesRaw) setPriorityMap(JSON.parse(prioritiesRaw));

      const onOnline = () => setOnline(true);
      const onOffline = () => setOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (!session?.started_at) return;
    const tick = () => {
      const diffMs = Date.now() - new Date(session.started_at).getTime();
      setSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session?.started_at]);

  useEffect(() => {
    if (!customerModal) return;
    void searchCustomers(customerForm.customerName);
  }, [customerForm.customerName, customerModal]);

  useEffect(() => {
    if (!activeProduct) return;
    const variantPreset = productVariantMap[activeProduct.id];
    const fallbackSize = variantPreset?.sizes?.[0] || activeProduct.size || "Pre-size";
    const fallbackColor = variantPreset?.colors?.[0] || "";
    setCustomerForm((prev) => ({
      ...prev,
      size: prev.size || fallbackSize,
      color: prev.color || fallbackColor,
    }));
  }, [activeProduct, productVariantMap]);

  async function loadSuppliers() {
    try {
      const items = await listSuppliers();
      setSuppliers(items);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers.");
    }
  }

  async function loadBalances() {
    try {
      const data = await listCustomerBalances();
      setBalanceMap(data);
    } catch {
      // Balance lookup should not block encoding.
    }
  }

  async function searchCustomers(query: string) {
    try {
      const items = await listCustomers(query);
      setCustomerSuggestions(items.slice(0, 6));
    } catch {
      setCustomerSuggestions([]);
    }
  }

  async function loadProducts(supplierId: string) {
    const items = await listProducts(supplierId);
    setProducts(items);
    setActiveProductState(items.find((item) => item.is_active) ?? null);
  }

  async function loadOrders(activeSessionId: string, search = orderSearch) {
    const rows = await listSessionOrderRows(activeSessionId, search);
    setOrderRows(rows);
  }

  async function onSelectSupplier(supplier: Supplier) {
    setLoading(true);
    setError(null);
    try {
      setSelectedSupplier(supplier);
      const activeSession = await getOrStartLiveSession(supplier.id);
      setSession(activeSession);
      await Promise.all([loadProducts(supplier.id), loadOrders(activeSession.id)]);
    } catch (err: any) {
      setError(err.message || "Failed to start live session.");
    } finally {
      setLoading(false);
    }
  }

  async function onAddSupplier() {
    if (!newSupplier.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supplier = await createSupplier(newSupplier.name);
      setSuppliers((prev) => [supplier, ...prev]);

      if (newSupplier.logoUrl.trim()) {
        const next = { ...supplierLogoMap, [supplier.id]: newSupplier.logoUrl.trim() };
        setSupplierLogoMap(next);
        window.localStorage.setItem("ls-supplier-logos", JSON.stringify(next));
      }

      setNewSupplier({ name: "", logoUrl: "" });
      setSupplierModal(false);
      await onSelectSupplier(supplier);
    } catch (err: any) {
      setError(err.message || "Unable to add supplier.");
    } finally {
      setLoading(false);
    }
  }

  async function onAddProduct() {
    if (!selectedSupplier || !newProduct.product_code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createProduct({
        supplier_id: selectedSupplier.id,
        product_code: newProduct.product_code,
        stock: Number(newProduct.stock),
        category: newProduct.category,
        price: Number(newProduct.price),
        size: newProduct.size,
        photo_url: newProduct.photo_url,
      });

      const created = await listProducts(selectedSupplier.id, newProduct.product_code.trim().toUpperCase());
      const createdItem = created.find((item) => item.product_code === newProduct.product_code.trim().toUpperCase());
      if (createdItem) {
        const variants = {
          sizes: parseCsv(newProduct.variantSizes),
          colors: parseCsv(newProduct.variantColors),
        };
        const nextVariants = { ...productVariantMap, [createdItem.id]: variants };
        setProductVariantMap(nextVariants);
        window.localStorage.setItem("ls-product-variants", JSON.stringify(nextVariants));
      }

      setProductModal(false);
      setNewProduct({
        product_code: "",
        stock: 1,
        category: "",
        price: "0",
        size: "",
        variantSizes: "",
        variantColors: "",
        photo_url: "",
      });
      await loadProducts(selectedSupplier.id);
    } catch (err: any) {
      setError(err.message || "Unable to add product.");
    } finally {
      setLoading(false);
    }
  }

  async function onActivateProduct(product: Product) {
    if (!selectedSupplier || product.stock <= 0) return;
    try {
      const next = await setActiveProduct(selectedSupplier.id, product.id);
      setActiveProductState(next);
      await loadProducts(selectedSupplier.id);
    } catch (err: any) {
      setError(err.message || "Unable to activate product.");
    }
  }

  async function onAddCustomerLine() {
    if (!session || !activeProduct) return;
    if (!customerForm.customerName.trim() || customerForm.qty < 1) return;

    if (!online) {
      const queued = {
        type: "ADD_CUSTOMER_LINE",
        payload: {
          sessionId: session.id,
          productId: activeProduct.id,
          customerName: customerForm.customerName,
          qty: customerForm.qty,
          color: customerForm.color,
          size: customerForm.size,
          note: customerForm.note,
          createdAt: new Date().toISOString(),
        },
      };
      const current = JSON.parse(window.localStorage.getItem("ls-offline-queue") || "[]");
      window.localStorage.setItem("ls-offline-queue", JSON.stringify([queued, ...current]));
      setError("Offline mode: line saved locally and will need sync when internet is restored.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const customer = customerForm.customerId
        ? customerSuggestions.find((item) => item.id === customerForm.customerId) || (await findOrCreateCustomer(customerForm.customerName))
        : await findOrCreateCustomer(customerForm.customerName);

      const normalizedQty = Number(customerForm.qty) > 0 ? Number(customerForm.qty) : 1;
      const normalizedSize = customerForm.size.trim() || "Pre-size";
      const lineNote = buildVariantNote({ color: customerForm.color, size: normalizedSize, note: customerForm.note });

      await addMinerLine({
        sessionId: session.id,
        customerId: customer.id,
        productId: activeProduct.id,
        qty: normalizedQty,
        note: lineNote,
      });

      setCustomerModal(false);
      setCustomerForm({ customerId: "", customerName: "", qty: 1, color: "", size: activeProduct.size || "", note: "" });
      await Promise.all([loadProducts(activeProduct.supplier_id), loadOrders(session.id), loadBalances()]);
    } catch (err: any) {
      setError(err.message || "Failed to add customer line. Check stock and customer data.");
    } finally {
      setLoading(false);
    }
  }

  async function onEditRow(row: LiveOrderRow) {
    const nextQty = window.prompt("New quantity", String(row.qty));
    if (!nextQty) return;
    const parsed = Number(nextQty);
    if (!Number.isFinite(parsed) || parsed < 1) return;

    try {
      await updateMinerLineQty(row.line_id, parsed);
      if (session && selectedSupplier) {
        await Promise.all([loadOrders(session.id), loadProducts(selectedSupplier.id)]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update order line.");
    }
  }

  async function onDeleteRow(row: LiveOrderRow) {
    try {
      await removeMinerLine(row.line_id);
      if (session && selectedSupplier) {
        await Promise.all([loadOrders(session.id), loadProducts(selectedSupplier.id)]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove order line.");
    }
  }

  async function onOpenSummary() {
    if (!session) return;
    const nextSummary = await getSessionSummary(session.id);
    setSummary(nextSummary);
    setSummaryModal(true);
  }

  async function onGenerateDraftInvoices() {
    await onCloseSession();
  }

  function onExportSummary() {
    const csv = [
      ["distinct_products_sold", summary.distinctProductsSold],
      ["total_quantity_sold", summary.totalQuantitySold],
      ["total_sales_amount", summary.totalSalesAmount],
      ["total_customers", summary.totalMiners],
      ["unpaid_total", summary.unpaidTotal],
    ]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `live-summary-${session?.id ?? "session"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updatePriority(customerId: string) {
    const current = priorityMap[customerId] ?? "normal";
    const next = PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(current) + 1) % PRIORITY_ORDER.length];
    const updated = { ...priorityMap, [customerId]: next };
    setPriorityMap(updated);
    window.localStorage.setItem("ls-customer-priorities", JSON.stringify(updated));
  }

  async function onCloseSession() {
    if (!session) return;
    await generateDraftInvoices(session.id);
    await endLiveSession(session.id);
    setSession(null);
    setSummaryModal(false);
    setSelectedSupplier(null);
    setProducts([]);
    setActiveProductState(null);
    setOrderRows([]);
    router.push("/invoices");
  }

  async function onSupplierFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setNewSupplier((prev) => ({ ...prev, logoUrl: dataUrl }));
  }

  async function onProductFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setNewProduct((prev) => ({ ...prev, photo_url: dataUrl }));
  }

  const selectedSupplierLogo = selectedSupplier ? supplierLogoMap[selectedSupplier.id] : "";

  return (
    <div className="space-y-4 pb-2">
      {!online ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Offline mode active. New entries are queued locally until internet returns.
        </div>
      ) : null}

      <Card className="sticky top-4 z-30 border-border bg-panel/95 p-3 shadow-card backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ImageThumb imageUrl={selectedSupplierLogo} fallbackLabel={selectedSupplier?.name || "Supplier"} square />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{selectedSupplier?.name || "Select supplier"}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Badge tone={session ? "success" : "default"}>{session ? "LIVE" : "IDLE"}</Badge>
                {session ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} /> {formatSeconds(seconds)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSupplierModal(true)}>
              <Plus size={14} /> Supplier
            </Button>
            {session ? (
              <Button size="sm" variant="danger" onClick={onOpenSummary}>
                End Live
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-3 border-border bg-panel shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none ring-primary/20 transition focus:ring-4"
              placeholder="Search supplier"
              value={supplierSearch}
              onChange={(event) => setSupplierSearch(event.target.value)}
            />
          </div>
          <Button size="sm" onClick={() => setSupplierModal(true)}>
            + Add
          </Button>
        </div>
        <div className="max-h-36 space-y-2 overflow-y-auto">
          {filteredSuppliers.map((supplier) => (
            <button
              key={supplier.id}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left",
                selectedSupplier?.id === supplier.id ? "border-primary/45 bg-primary/5" : "",
              )}
              onClick={() => onSelectSupplier(supplier)}
            >
              <div className="flex items-center gap-2">
                <ImageThumb imageUrl={supplierLogoMap[supplier.id]} fallbackLabel={supplier.name} tiny />
                <span className="text-sm font-medium text-foreground">{supplier.name}</span>
              </div>
              {selectedSupplier?.id === supplier.id ? <CircleCheck size={16} className="text-primary" /> : <Play size={16} className="text-muted" />}
            </button>
          ))}
          {filteredSuppliers.length === 0 ? <EmptyState title="No supplier found" body="Add a supplier to start session encoding." /> : null}
        </div>
      </Card>

      {selectedSupplier ? (
        <div className="space-y-3">
          <Card className="space-y-3 border-border bg-panel shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Active Product</h2>
              <Button size="sm" onClick={() => setProductModal(true)}>
                <PackagePlus size={14} /> Add Product
              </Button>
            </div>

            {activeProduct ? (
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0.4, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <div className="flex items-start gap-3">
                  <ImageThumb imageUrl={activeProduct.photo_url || undefined} fallbackLabel={activeProduct.product_code} />
                  <div className="flex-1">
                    <p className="text-xs text-muted">Product code</p>
                    <p className="text-xl font-semibold tracking-wide text-foreground">{activeProduct.product_code}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={activeProduct.stock === 0 ? "danger" : activeProduct.stock <= lowStockThreshold ? "warning" : "success"}>
                        Stock {activeProduct.stock}
                      </Badge>
                      <span className="text-muted">{formatCurrency(activeProduct.price)}</span>
                      {activeProduct.size ? <span className="text-muted">Default size: {activeProduct.size}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="lg" onClick={() => setCustomerModal(true)} disabled={activeProduct.stock === 0 || !session || loading}>
                    <UserRoundPlus size={16} /> + Add Customer
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => setOrderModal(true)}>
                    <ListOrdered size={16} /> Order List
                  </Button>
                </div>
              </motion.div>
            ) : (
              <EmptyState title="No active product" body="Select a product below to start fast customer encoding." />
            )}
          </Card>

          <Card className="space-y-3 border-border bg-panel shadow-card">
            <Input placeholder="Search product code" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} />

            {visibleProducts.length === 0 ? (
              <EmptyState title="No products" body="Add products for this supplier to continue." ctaLabel="Add Product" onClick={() => setProductModal(true)} />
            ) : (
              <div className="space-y-2">
                {visibleProducts.map((product) => {
                  const soldOut = product.stock === 0;
                  const lowStock = product.stock > 0 && product.stock <= lowStockThreshold;
                  return (
                    <button
                      key={product.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                        product.is_active ? "border-primary/45 bg-primary/5" : "border-border bg-background",
                        soldOut ? "opacity-65" : "",
                      )}
                      onClick={() => onActivateProduct(product)}
                      disabled={soldOut}
                    >
                      <ImageThumb imageUrl={product.photo_url || undefined} fallbackLabel={product.product_code} tiny />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{product.product_code}</p>
                        <p className="text-xs text-muted">
                          {formatCurrency(product.price)} {product.size ? `• ${product.size}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        {soldOut ? <Badge tone="danger">Sold out</Badge> : lowStock ? <Badge tone="warning">Low stock</Badge> : <Badge tone="success">Ready</Badge>}
                        <p className="mt-1 text-xs font-semibold text-foreground">{product.stock} pcs</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState title="Choose supplier first" body="Select a supplier to activate live encoding mode." />
      )}

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5" />
          <p>{error}</p>
        </div>
      ) : null}

      <button
        className="fixed bottom-24 right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-soft"
        onClick={() => setOrderModal(true)}
      >
        <ListOrdered size={18} /> Orders ({orderRows.length})
      </button>

      <Modal open={supplierModal} onClose={() => setSupplierModal(false)} title="Add Supplier">
        <div className="space-y-3">
          <Input
            label="Supplier name"
            placeholder="e.g. Trendy Seoul"
            value={newSupplier.name}
            onChange={(event) => setNewSupplier((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Store logo URL (optional)"
            placeholder="https://..."
            value={newSupplier.logoUrl}
            onChange={(event) => setNewSupplier((prev) => ({ ...prev, logoUrl: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
              <Upload size={14} /> Gallery
              <input type="file" accept="image/*" className="hidden" onChange={(event) => void onSupplierFile(event)} />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
              <Camera size={14} /> Camera
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void onSupplierFile(event)} />
            </label>
          </div>
          <Button className="w-full" size="lg" onClick={onAddSupplier} disabled={!newSupplier.name.trim() || loading}>
            Save Supplier
          </Button>
        </div>
      </Modal>

      <Modal open={productModal} onClose={() => setProductModal(false)} title="Add Product">
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Product Code"
            placeholder="e.g. AB12"
            value={newProduct.product_code}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, product_code: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Stocks"
              type="number"
              min={1}
              value={String(newProduct.stock)}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, stock: Number(event.target.value) }))}
            />
            <Input
              label="Price"
              type="number"
              min={0}
              step="0.01"
              value={newProduct.price}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
            />
          </div>
          <Input
            label="Category"
            value={newProduct.category}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, category: event.target.value }))}
          />
          <Input label="Size" value={newProduct.size} onChange={(event) => setNewProduct((prev) => ({ ...prev, size: event.target.value }))} />
          <Input
            label="Variant Sizes (comma-separated)"
            placeholder="S, M, L"
            value={newProduct.variantSizes}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, variantSizes: event.target.value }))}
          />
          <Input
            label="Variant Colors (comma-separated)"
            placeholder="Black, White, Red"
            value={newProduct.variantColors}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, variantColors: event.target.value }))}
          />
          <Input
            label="Product image URL (optional)"
            value={newProduct.photo_url}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, photo_url: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
              <Upload size={14} /> Gallery
              <input type="file" accept="image/*" className="hidden" onChange={(event) => void onProductFile(event)} />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
              <Camera size={14} /> Camera
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void onProductFile(event)} />
            </label>
          </div>
          <Button className="w-full" size="lg" onClick={onAddProduct} disabled={loading || !newProduct.product_code.trim()}>
            Save Product
          </Button>
        </div>
      </Modal>

      <Modal open={customerModal} onClose={() => setCustomerModal(false)} title="Add Customer Order">
        <div className="space-y-3">
          <Input
            label="Customer"
            placeholder="Search or type new customer"
            value={customerForm.customerName}
            onChange={(event) => setCustomerForm((prev) => ({ ...prev, customerName: event.target.value, customerId: "" }))}
          />

          <div className="max-h-32 space-y-2 overflow-y-auto">
            {customerSuggestions.map((customer) => {
              const unpaid = balanceMap[customer.id] || 0;
              return (
                <button
                  key={customer.id}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left",
                    customerForm.customerId === customer.id ? "border-primary/45 bg-primary/5" : "",
                  )}
                  onClick={() =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      customerId: customer.id,
                      customerName: customer.full_name,
                    }))
                  }
                >
                  <p className="text-sm font-medium text-foreground">{customer.full_name}</p>
                  {unpaid > 0 ? <Badge tone="warning">Balance {formatCurrency(unpaid)}</Badge> : <Badge tone="success">Clear</Badge>}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={String(customerForm.qty)}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, qty: Number(event.target.value) }))}
            />
            <Input
              label="Size"
              placeholder="e.g. M"
              value={customerForm.size}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, size: event.target.value }))}
            />
          </div>

          <div>
            <p className="mb-1 text-sm text-muted">Color</p>
            <div className="flex flex-wrap gap-2">
              {(productVariantMap[activeProduct?.id || ""]?.colors?.length ? productVariantMap[activeProduct?.id || ""]?.colors : COLOR_OPTIONS).map((color) => (
                <button
                  key={color}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    customerForm.color === color ? "border-primary bg-primary/10 text-primary" : "border-border text-muted",
                  )}
                  onClick={() => setCustomerForm((prev) => ({ ...prev, color }))}
                >
                  {customerForm.color === color ? <Check size={12} className="mr-1 inline" /> : null}
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm text-muted">Size presets</p>
            <div className="flex flex-wrap gap-2">
              {(productVariantMap[activeProduct?.id || ""]?.sizes?.length
                ? productVariantMap[activeProduct?.id || ""]?.sizes
                : [activeProduct?.size || "Pre-size"]
              ).map((size) => (
                <button
                  key={size}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    customerForm.size === size ? "border-primary bg-primary/10 text-primary" : "border-border text-muted",
                  )}
                  onClick={() => setCustomerForm((prev) => ({ ...prev, size }))}
                >
                  {customerForm.size === size ? <Check size={12} className="mr-1 inline" /> : null}
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Note (optional)"
            value={customerForm.note}
            onChange={(event) => setCustomerForm((prev) => ({ ...prev, note: event.target.value }))}
          />

          <Button
            className="w-full"
            size="lg"
            onClick={onAddCustomerLine}
            disabled={!customerForm.customerName.trim() || customerForm.qty < 1 || loading || !activeProduct}
          >
            <Sparkles size={16} /> Save Customer Line
          </Button>
        </div>
      </Modal>

      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="Order Workspace" className="sm:max-w-2xl">
        <div className="space-y-3">
          <SegmentedControl
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { label: "By Customer", value: "customer" },
              { label: "By Product", value: "product" },
            ]}
          />
          <Input
            placeholder="Search customer or product"
            value={orderSearch}
            onChange={async (event) => {
              const next = event.target.value;
              setOrderSearch(next);
              if (session) await loadOrders(session.id, next);
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <SummaryStat
              label="Customer Totals"
              value={`${totalsByCustomer.size} customers`}
              body={`${formatCurrency([...totalsByCustomer.values()].reduce((sum, item) => sum + item.amount, 0))} total value`}
            />
            <SummaryStat
              label="Product Totals"
              value={`${totalsByProduct.size} products`}
              body={`${formatCount([...totalsByProduct.values()].reduce((sum, item) => sum + item.qty, 0))} units sold`}
            />
          </div>

          <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
            {groupedRows.map(([group, rows]) => (
              <Card key={group} className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{group}</p>
                  <div className="flex items-center gap-2">
                    {groupBy === "customer" ? (
                      <button
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                          priorityTone(rows[0].priority),
                        )}
                        onClick={() => updatePriority(rows[0].customer_id)}
                      >
                        <Crown size={12} /> {rows[0].priority.toUpperCase()}
                      </button>
                    ) : null}
                    <Badge>{rows.length}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.line_id} className="rounded-xl border border-border bg-background p-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-foreground">{row.product_code}</p>
                        <p className="font-semibold text-primary">{formatCurrency(row.line_total)}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.customer_name} • Qty {row.qty} • {row.color || "No color"} / {row.size || "No size"}
                      </p>
                      {row.userNote ? <p className="mt-1 text-xs text-muted">Note: {row.userNote}</p> : null}
                      {groupBy === "product" ? (
                        <p className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", priorityTone(row.priority))}>
                          {row.priority.toUpperCase()} PRIORITY
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onEditRow(row)}>
                          Edit Qty
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onDeleteRow(row)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            {groupedRows.length === 0 ? <EmptyState title="No orders yet" body="Add customer lines to view grouped orders here." /> : null}
          </div>
        </div>
      </Modal>

      <Modal open={summaryModal} onClose={() => setSummaryModal(false)} title="End Live Summary">
        <div className="space-y-3">
          <SummaryItem label="Products Sold" value={String(summary.distinctProductsSold)} />
          <SummaryItem label="Total Quantity" value={String(summary.totalQuantitySold)} />
          <SummaryItem label="Total Sales" value={formatCurrency(summary.totalSalesAmount)} />
          <SummaryItem label="Total Customers" value={String(summary.totalMiners)} />
          <SummaryItem label="Unpaid Total" value={formatCurrency(summary.unpaidTotal)} />

          <Button className="w-full" size="lg" onClick={onGenerateDraftInvoices} disabled={loading}>
            Close Session & Open Invoices
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onExportSummary}>
              Export CSV
            </Button>
            <Button variant="danger" onClick={onCloseSession}>
              Close Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value, body }: { label: string; value: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-2.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{body}</p>
    </div>
  );
}

function ImageThumb({
  imageUrl,
  fallbackLabel,
  tiny,
  square,
}: {
  imageUrl?: string;
  fallbackLabel: string;
  tiny?: boolean;
  square?: boolean;
}) {
  const sizeClass = tiny ? "h-8 w-8" : square ? "h-12 w-12" : "h-16 w-16";

  if (imageUrl) {
    return (
      <div
        className={cn("overflow-hidden rounded-xl border border-border bg-panel bg-cover bg-center", sizeClass)}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center rounded-xl border border-border bg-background", sizeClass)}>
      <span className="text-xs font-semibold text-muted">{getInitials(fallbackLabel)}</span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function buildVariantNote({ color, size, note }: { color?: string; size?: string; note?: string }) {
  return `variant:${color || ""}|${size || ""}|${note || ""}`;
}

function parseVariantNote(note?: string | null) {
  if (!note) return { color: "", size: "", userNote: "" };
  if (!note.startsWith("variant:")) return { color: "", size: "", userNote: note };

  const raw = note.replace("variant:", "");
  const [color = "", size = "", userNote = ""] = raw.split("|");
  return { color, size, userNote };
}

function priorityTone(priority: CustomerPriority) {
  if (priority === "vip") return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200";
  if (priority === "high") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function parseCsv(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
