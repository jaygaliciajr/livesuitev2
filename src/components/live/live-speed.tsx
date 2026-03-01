"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CircleCheck, Clock3, ListOrdered, PackagePlus, Play, Plus, ScanLine, UserRoundPlus } from "lucide-react";
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
  listProducts,
  listSessionOrderRows,
  listSuppliers,
  removeMinerLine,
  setActiveProduct,
  updateMinerLineQty,
} from "@/lib/data";
import { cn, formatCurrency, formatSeconds } from "@/lib/utils";
import { GroupByMode, LiveOrderRow, LiveSession, Product, SessionSummary, Supplier } from "@/types/domain";

const initialSummary: SessionSummary = {
  distinctProductsSold: 0,
  totalQuantitySold: 0,
  totalSalesAmount: 0,
  totalMiners: 0,
  unpaidTotal: 0,
};

export function LiveSpeedScreen() {
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

  const [supplierModal, setSupplierModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [minerModal, setMinerModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [summary, setSummary] = useState<SessionSummary>(initialSummary);

  const [newSupplierName, setNewSupplierName] = useState("");
  const [newProduct, setNewProduct] = useState({
    product_code: "",
    stock: 1,
    category: "",
    price: "0",
    size: "",
    photo_url: "",
  });
  const [minerForm, setMinerForm] = useState({ customerName: "", qty: 1, note: "" });

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

  const groupedRows = useMemo(() => {
    const groups = new Map<string, LiveOrderRow[]>();
    orderRows.forEach((row) => {
      const key = groupBy === "customer" ? row.customer_name : row.product_code;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(row);
    });
    return [...groups.entries()];
  }, [groupBy, orderRows]);

  useEffect(() => {
    loadSuppliers();
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

  async function loadSuppliers() {
    try {
      const items = await listSuppliers();
      setSuppliers(items);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers.");
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
    if (!newSupplierName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supplier = await createSupplier(newSupplierName);
      setSuppliers((prev) => [supplier, ...prev]);
      setNewSupplierName("");
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
      setProductModal(false);
      setNewProduct({ product_code: "", stock: 1, category: "", price: "0", size: "", photo_url: "" });
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

  async function onAddMiner() {
    if (!session || !activeProduct) return;
    if (minerForm.qty < 1) return;
    setLoading(true);
    setError(null);
    try {
      const customer = await findOrCreateCustomer(minerForm.customerName);
      await addMinerLine({
        sessionId: session.id,
        customerId: customer.id,
        productId: activeProduct.id,
        qty: minerForm.qty,
        note: minerForm.note,
      });
      setMinerModal(false);
      setMinerForm({ customerName: "", qty: 1, note: "" });
      await Promise.all([loadProducts(activeProduct.supplier_id), loadOrders(session.id)]);
    } catch (err: any) {
      setError(err.message || "Failed to add miner. Check stock and customer name.");
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
    if (!session) return;
    setLoading(true);
    try {
      await generateDraftInvoices(session.id);
      await onCloseSession();
    } catch (err: any) {
      setError(err.message || "Failed to generate invoices.");
    } finally {
      setLoading(false);
    }
  }

  function onExportSummary() {
    const csv = [
      ["distinct_products_sold", summary.distinctProductsSold],
      ["total_quantity_sold", summary.totalQuantitySold],
      ["total_sales_amount", summary.totalSalesAmount],
      ["total_miners", summary.totalMiners],
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

  async function onCloseSession() {
    if (!session) return;
    await endLiveSession(session.id);
    setSession(null);
    setSummaryModal(false);
    setSelectedSupplier(null);
    setProducts([]);
    setActiveProductState(null);
    setOrderRows([]);
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Live Speed Mode</h1>
          <Button size="sm" variant="secondary" onClick={() => setSupplierModal(true)}>
            <Plus size={15} /> Add Supplier
          </Button>
        </div>

        <Card className="sticky top-4 z-30 flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-[#0f68d2] text-white shadow-soft">
          <div>
            <p className="text-xs text-white/85">Active Supplier</p>
            <p className="text-sm font-semibold">{selectedSupplier?.name || "Select supplier to start"}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge tone={session ? "success" : "default"} className={session ? "bg-emerald-300 text-emerald-950" : "bg-white/20 text-white"}>
                {session ? "LIVE" : "IDLE"}
              </Badge>
              {session ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} /> {formatSeconds(seconds)}
                </span>
              ) : null}
            </div>
          </div>
          {session ? (
            <Button variant="danger" size="sm" onClick={onOpenSummary}>
              End Live
            </Button>
          ) : null}
        </Card>

        <div className="space-y-2">
          <Input
            label="Find supplier"
            placeholder="Type supplier name"
            value={supplierSearch}
            onChange={(event) => setSupplierSearch(event.target.value)}
          />
          <div className="max-h-32 space-y-2 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border border-border bg-panel px-3 py-2 text-left text-sm",
                  selectedSupplier?.id === supplier.id ? "border-primary bg-primary/5" : "",
                )}
                onClick={() => onSelectSupplier(supplier)}
              >
                <span>{supplier.name}</span>
                {selectedSupplier?.id === supplier.id ? <CircleCheck size={16} className="text-primary" /> : <Play size={16} className="text-muted" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {selectedSupplier ? (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Active Product</h2>
              <Button size="sm" onClick={() => setProductModal(true)}>
                <PackagePlus size={15} /> Add Product
              </Button>
            </div>

            {activeProduct ? (
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted">Product Code</p>
                    <p className="text-2xl font-semibold tracking-wide text-primary">{activeProduct.product_code}</p>
                  </div>
                  <Badge tone={activeProduct.stock === 0 ? "danger" : activeProduct.stock <= lowStockThreshold ? "warning" : "success"}>
                    Stock: {activeProduct.stock}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                  <p>Price: <span className="font-semibold text-foreground">{formatCurrency(activeProduct.price)}</span></p>
                  <p>Miners: <span className="font-semibold text-foreground">{orderRows.filter((row) => row.product_id === activeProduct.id).length}</span></p>
                </div>
                <Button className="mt-3 w-full" size="lg" onClick={() => setMinerModal(true)} disabled={activeProduct.stock === 0 || !session || loading}>
                  <UserRoundPlus size={18} /> + Add Miner
                </Button>
              </motion.div>
            ) : (
              <EmptyState title="No active product" body="Tap a product from the list below to activate it." />
            )}
          </Card>

          <Card className="space-y-3">
            <Input
              placeholder="Search product code"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
            {visibleProducts.length === 0 ? (
              <EmptyState title="No products yet" body="Add your first product for this supplier." ctaLabel="Add Product" onClick={() => setProductModal(true)} />
            ) : (
              <div className="space-y-2">
                {visibleProducts.map((product) => {
                  const soldOut = product.stock === 0;
                  const lowStock = product.stock > 0 && product.stock <= lowStockThreshold;
                  return (
                    <button
                      key={product.id}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                        product.is_active ? "border-primary bg-primary/10" : "border-border bg-panel",
                        soldOut ? "opacity-60" : "",
                      )}
                      onClick={() => onActivateProduct(product)}
                      disabled={soldOut}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{product.product_code}</p>
                        <p className="text-xs text-muted">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {soldOut ? <Badge tone="danger">SOLD OUT</Badge> : lowStock ? <Badge tone="warning">LOW STOCK</Badge> : <Badge tone="success">READY</Badge>}
                        <span className="text-xs font-semibold text-foreground">{product.stock}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState title="Choose supplier first" body="Select a supplier above to activate live encoding mode." />
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
        <ListOrdered size={18} /> Order List ({orderRows.length})
      </button>

      <Modal open={supplierModal} onClose={() => setSupplierModal(false)} title="Add Supplier">
        <div className="space-y-3">
          <Input label="Supplier name" placeholder="e.g. Trendy Seoul" value={newSupplierName} onChange={(event) => setNewSupplierName(event.target.value)} />
          <Button className="w-full" size="lg" onClick={onAddSupplier} disabled={!newSupplierName.trim() || loading}>
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
            label="Photo URL (optional)"
            value={newProduct.photo_url}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, photo_url: event.target.value }))}
          />
          <Input label="Open Camera" type="file" accept="image/*" capture="environment" />
          <Button className="w-full" size="lg" onClick={onAddProduct} disabled={loading || !newProduct.product_code.trim()}>
            Save Product
          </Button>
        </div>
      </Modal>

      <Modal open={minerModal} onClose={() => setMinerModal(false)} title="Add Miner">
        <div className="space-y-3">
          <Input
            label="Customer name"
            placeholder="Type customer"
            value={minerForm.customerName}
            onChange={(event) => setMinerForm((prev) => ({ ...prev, customerName: event.target.value }))}
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={String(minerForm.qty)}
            onChange={(event) => setMinerForm((prev) => ({ ...prev, qty: Number(event.target.value) }))}
          />
          <Input label="Note (optional)" value={minerForm.note} onChange={(event) => setMinerForm((prev) => ({ ...prev, note: event.target.value }))} />
          <Button
            className="w-full"
            size="lg"
            onClick={onAddMiner}
            disabled={!minerForm.customerName.trim() || minerForm.qty < 1 || loading}
          >
            <ScanLine size={16} /> Save Miner
          </Button>
        </div>
      </Modal>

      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="Order List" className="sm:max-w-2xl">
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
              if (session) {
                await loadOrders(session.id, next);
              }
            }}
          />
          <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            {groupedRows.map(([group, rows]) => (
              <Card key={group} className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{group}</p>
                  <Badge>{rows.length}</Badge>
                </div>
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.line_id} className="rounded-xl bg-background p-2">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-foreground">{row.product_code}</p>
                        <p className="font-semibold text-primary">{formatCurrency(row.line_total)}</p>
                      </div>
                      <p className="text-xs text-muted">{row.customer_name} • Qty {row.qty}</p>
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
            {groupedRows.length === 0 ? <EmptyState title="No orders yet" body="Add miner lines to see them here." /> : null}
          </div>
        </div>
      </Modal>

      <Modal open={summaryModal} onClose={() => setSummaryModal(false)} title="End Live Summary">
        <div className="space-y-3">
          <SummaryItem label="Products Sold" value={String(summary.distinctProductsSold)} />
          <SummaryItem label="Total Quantity" value={String(summary.totalQuantitySold)} />
          <SummaryItem label="Total Sales" value={formatCurrency(summary.totalSalesAmount)} />
          <SummaryItem label="Total Miners" value={String(summary.totalMiners)} />
          <SummaryItem label="Unpaid Total" value={formatCurrency(summary.unpaidTotal)} />

          <Button className="w-full" size="lg" onClick={onGenerateDraftInvoices} disabled={loading}>
            Generate Draft Invoices
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
    <div className="flex items-center justify-between rounded-xl bg-panel px-3 py-2">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
