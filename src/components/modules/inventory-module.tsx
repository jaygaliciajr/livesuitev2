"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createProduct, deleteProduct, listProducts, listSuppliers, updateProduct } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Product, Supplier } from "@/types/domain";

export function InventoryModule() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ product_code: "", stock: 1, price: "0" });

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    void loadProducts(supplierId, search);
  }, [supplierId, search]);

  async function init() {
    const sup = await listSuppliers();
    setSuppliers(sup);
    if (sup[0]) setSupplierId(sup[0].id);
  }

  async function loadProducts(nextSupplierId: string, nextSearch = "") {
    const data = await listProducts(nextSupplierId || undefined, nextSearch);
    setProducts(data);
  }

  async function onCreate() {
    if (!supplierId || !form.product_code.trim()) return;
    await createProduct({
      supplier_id: supplierId,
      product_code: form.product_code,
      stock: form.stock,
      price: Number(form.price),
    });
    setForm({ product_code: "", stock: 1, price: "0" });
    await loadProducts(supplierId, search);
  }

  async function onEdit(product: Product) {
    const nextStock = Number(window.prompt("Stock", String(product.stock)));
    if (!Number.isFinite(nextStock)) return;
    const nextPrice = Number(window.prompt("Price", String(product.price)));
    if (!Number.isFinite(nextPrice)) return;
    await updateProduct(product.id, { stock: Math.max(0, nextStock), price: Math.max(0, nextPrice) });
    await loadProducts(supplierId, search);
  }

  async function onDelete(product: Product) {
    if (!window.confirm(`Delete product ${product.product_code}?`)) return;
    await deleteProduct(product.id);
    await loadProducts(supplierId, search);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Inventory</h1>
      </header>
      <Card className="space-y-2">
        <label className="text-xs text-muted">Supplier</label>
        <select className="h-11 rounded-xl border border-border bg-panel px-3 text-sm" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
          <option value="">All suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <Input placeholder="Search product code" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Code" value={form.product_code} onChange={(event) => setForm((prev) => ({ ...prev, product_code: event.target.value }))} />
          <Input type="number" min={1} placeholder="Stock" value={String(form.stock)} onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))} />
          <Input type="number" min={0} placeholder="Price" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
        </div>
        <Button onClick={onCreate}>Add Product</Button>
      </Card>
      <div className="space-y-2">
        {products.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{item.product_code}</p>
              <p className="text-xs text-muted">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={item.stock <= 0 ? "danger" : item.stock <= 3 ? "warning" : "success"}>Stock {item.stock}</Badge>
              <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {products.length === 0 ? <EmptyState title="No inventory" body="Add products to a supplier to start live selling." /> : null}
    </div>
  );
}
