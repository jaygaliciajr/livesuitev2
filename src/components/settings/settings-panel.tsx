"use client";

import { useEffect, useState } from "react";
import { Download, MoonStar, Store, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { exportTableCsv } from "@/lib/data";
import { useTheme } from "@/components/settings/theme-provider";

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState({ store_name: "", contact: "", address: "" });
  const [currency, setCurrency] = useState("PHP");
  const [confirmEndLive, setConfirmEndLive] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(3);

  useEffect(() => {
    const profileRaw = window.localStorage.getItem("ls-profile");
    if (profileRaw) setProfile(JSON.parse(profileRaw));
    const currencyRaw = window.localStorage.getItem("ls-currency");
    if (currencyRaw) setCurrency(currencyRaw);
    const confirmRaw = window.localStorage.getItem("ls-confirm-end-live");
    if (confirmRaw) setConfirmEndLive(confirmRaw === "true");
    const thresholdRaw = Number(window.localStorage.getItem("ls-low-stock-threshold") || "3");
    if (thresholdRaw > 0) setLowStockThreshold(thresholdRaw);
  }, []);

  function saveSettings() {
    window.localStorage.setItem("ls-profile", JSON.stringify(profile));
    window.localStorage.setItem("ls-currency", currency);
    window.localStorage.setItem("ls-confirm-end-live", String(confirmEndLive));
    window.localStorage.setItem("ls-low-stock-threshold", String(lowStockThreshold));
  }

  async function exportCsv(table: "suppliers" | "products" | "customers" | "invoices") {
    const csv = await exportTableCsv(table);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${table}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Set defaults and export your data quickly.</p>
      </header>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Store Profile</h2>
        </div>
        <Input label="Store name" value={profile.store_name} onChange={(event) => setProfile((prev) => ({ ...prev, store_name: event.target.value }))} />
        <Input label="Contact" value={profile.contact} onChange={(event) => setProfile((prev) => ({ ...prev, contact: event.target.value }))} />
        <Input label="Address" value={profile.address} onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))} />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Theme</h2>
          <button className="flex items-center gap-2 rounded-xl bg-panel px-3 py-2 text-sm" onClick={toggleTheme}>
            {theme === "light" ? <MoonStar size={16} /> : <Sun size={16} />}
            {theme === "light" ? "Enable Dark" : "Enable Light"}
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
          <p className="text-sm text-muted">Default currency</p>
          <select
            className="rounded-lg border border-border bg-panel px-2 py-1 text-sm"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="PHP">PHP</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Session Settings</h2>
        <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
          <p className="text-sm text-muted">Confirm before End Live</p>
          <Toggle checked={confirmEndLive} onToggle={() => setConfirmEndLive((prev) => !prev)} />
        </div>
        <Input
          label="Low-stock threshold"
          type="number"
          min={1}
          value={String(lowStockThreshold)}
          onChange={(event) => setLowStockThreshold(Number(event.target.value))}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Data Backup / Export</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => exportCsv("suppliers")}>
            <Download size={15} /> Suppliers CSV
          </Button>
          <Button variant="secondary" onClick={() => exportCsv("products")}>
            <Download size={15} /> Inventory CSV
          </Button>
          <Button variant="secondary" onClick={() => exportCsv("customers")}>
            <Download size={15} /> Customers CSV
          </Button>
          <Button variant="secondary" onClick={() => exportCsv("invoices")}>
            <Download size={15} /> Invoices CSV
          </Button>
        </div>
      </Card>

      <Card className="space-y-1">
        <h2 className="text-sm font-semibold">Subscription</h2>
        <p className="text-sm text-muted">Current plan: Regular. Premium unlocks advanced automation and analytics.</p>
      </Card>

      <Button className="w-full" size="lg" onClick={saveSettings}>
        Save Settings
      </Button>
    </div>
  );
}
