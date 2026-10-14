import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { loadServerCollection, readCollection, readWorkspaceSettings, saveCollection, saveServerRecord, saveWorkspaceSettings } from "../services/localData";

function Settings() {
  const [settings, setSettings] = useState(readWorkspaceSettings);
  const [tab, setTab] = useState("Profile");
  const [mode] = useState(() => localStorage.getItem("mybillbuddy:session") ? "server" : "demo");
  const [email, setEmail] = useState(settings.email);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(mode === "server");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const tabs = ["Profile", "Business details", "Notifications", "Data & backup", "Security"];
  const backupCollections = ["customers", "products", "invoices", "payments", "stockMovements"];

  useEffect(() => {
    if (mode !== "server") return;
    Promise.all([api.get("/account/settings"), api.get("/auth/me")]).then(([preferences, account]) => {
      const next = { ...readWorkspaceSettings(), ...preferences.data, business: preferences.data.businessName, email: account.data.username };
      setSettings(next); setEmail(account.data.username); saveWorkspaceSettings(next);
    }).catch((requestError) => setError(requestError.response?.data?.message || "Could not load account settings."))
      .finally(() => setLoading(false));
  }, [mode]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      let next = settings;
      if (mode === "server") {
        const response = await api.put("/account/settings", { ...settings, businessName: settings.business, currency: settings.currency });
        next = { ...settings, ...response.data, business: response.data.businessName, email };
      }
      saveWorkspaceSettings(next); setSettings(next); setSaved(true); window.setTimeout(() => setSaved(false), 2500);
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not save settings."); }
    finally { setSaving(false); }
  };

  const downloadBackup = async () => {
    setError("");
    try {
      const collections = {};
      for (const name of backupCollections) collections[name] = mode === "server" ? await loadServerCollection(name) : readCollection(name);
      const backup = { format: "mybillbuddy-backup", version: 1, exportedAt: new Date().toISOString(), settings: readWorkspaceSettings(), collections };
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      link.download = `mybillbuddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not create the workspace backup."); }
  };

  const restoreBackup = async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const backup = JSON.parse(await file.text());
      if (backup.format !== "mybillbuddy-backup" || !backup.collections || !backupCollections.every((key) => Array.isArray(backup.collections[key]))) throw new Error("This file is not a valid MyBillBuddy backup.");
      if (!window.confirm("Merge this backup into the current workspace? Matching records will be updated; records not in the backup will be kept.")) return;
      setSaving(true);
      const identities = {
        customers: (item) => item.name,
        products: (item) => `${item.name}|${item.variant || ""}`,
        invoices: (item) => item.invoiceNumber,
        payments: (item) => `${item.invoiceNumber}|${item.date}|${item.amount}|${item.method}`,
        stockMovements: (item) => `${item.createdAt}|${item.productName}|${item.quantityChange}|${item.reason}`,
      };
      const serverFields = {
        customers: ["name", "email", "phone", "address", "gstin"],
        products: ["name", "category", "variant", "stock", "reorderLevel", "price"],
        invoices: ["invoiceNumber", "customerName", "date", "dueDate", "total", "status", "taxMode", "lineItems"],
        payments: ["customerName", "invoiceNumber", "amount", "method", "status", "date"],
      };
      const restoredProductIds = new Map();
      for (const name of backupCollections) {
        if (mode === "demo") {
          const merged = [...readCollection(name)];
          for (const item of backup.collections[name]) {
            const index = merged.findIndex((existing) => String(identities[name](existing)) === String(identities[name](item)));
            if (index >= 0) merged[index] = { ...merged[index], ...item };
            else merged.push({ ...item, id: item.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${merged.length}` });
          }
          saveCollection(name, merged);
        } else {
          let current = await loadServerCollection(name);
          for (const item of backup.collections[name]) {
            const existing = current.find((row) => String(identities[name](row)) === String(identities[name](item)));
            if (name === "stockMovements") {
              if (!existing) await api.post("/stock-movements", item);
              continue;
            }
            const record = Object.fromEntries(serverFields[name].filter((field) => Object.hasOwn(item, field)).map((field) => [field, item[field]]));
            if (name === "invoices") record.lineItems = (record.lineItems || []).map((line) => ({ ...line, productId: line.productId == null ? null : restoredProductIds.get(String(line.productId)) ?? null }));
            const result = await saveServerRecord(name, existing?.id ?? null, record);
            if (name === "products" && item.id != null) restoredProductIds.set(String(item.id), result.id);
            current = existing ? current.map((row) => String(row.id) === String(existing.id) ? result : row) : [...current, result];
          }
        }
      }
      if (mode === "server") {
        const currentProducts = await loadServerCollection("products");
        for (const snapshot of backup.collections.products) {
          const current = currentProducts.find((product) => String(identities.products(product)) === String(identities.products(snapshot)));
          if (current) await saveServerRecord("products", current.id, { name: snapshot.name, category: snapshot.category, variant: snapshot.variant || "", stock: Number(snapshot.stock || 0), reorderLevel: Number(snapshot.reorderLevel ?? 10), price: Number(snapshot.price || 0) });
        }
      }
      if (mode === "demo" && backup.settings) saveWorkspaceSettings({ ...readWorkspaceSettings(), ...backup.settings });
      if (mode === "server" && backup.settings) await api.put("/account/settings", { name: backup.settings.name, mobile: backup.settings.mobile, businessName: backup.settings.business, gstin: backup.settings.gstin, currency: backup.settings.currency, overdueReminders: backup.settings.overdueReminders, lowStockAlerts: backup.settings.lowStockAlerts, paymentAlerts: backup.settings.paymentAlerts });
      setSaved(true); window.setTimeout(() => setSaved(false), 3000);
    } catch (restoreError) { setError(restoreError.response?.data?.message || restoreError.message || "Could not restore this backup."); }
    finally { setSaving(false); }
  };

  return <div className="app-layout"><Sidebar /><main className="app-main">
    <div className="app-topbar"><span className="app-topbar-title">Workspace preferences</span><span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span></div>
    <section className="management-page"><div className={`demo-notice ${mode === "server" ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" ? "✓" : "ⓘ"}</span> {mode === "server" ? "Account settings sync to your API" : "Demo preferences are saved in this browser"}</div>{error && <div className="api-error" role="alert">{error}</div>}
      <div className="page-heading"><div><h1>Settings</h1><p>Set up the workspace around your business.</p></div></div>
      <div className="settings-card"><div className="settings-tabs" role="tablist" aria-label="Settings categories">{tabs.map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div>
        {tab === "Data & backup" ? <section className="settings-panel"><span className="dialog-eyebrow">PORTABLE WORKSPACE</span><h2>Back up or restore your records</h2><p>Download customers, products, invoices, payments, stock history, and workspace preferences in a JSON file.</p><div className="settings-save-row"><button className="real-primary-button" type="button" onClick={downloadBackup}>Download backup</button><label className="secondary-action" htmlFor="backup-file">Restore from backup</label><input id="backup-file" type="file" accept="application/json,.json" onChange={restoreBackup} hidden /></div><p className="settings-help">Restore merges records and updates matches. Records not included in the backup stay in this workspace. Server imports are applied in dependency order.</p>{saved && <p role="status" className="save-success">Backup restored.</p>}</section> : tab === "Security" ? <section className="settings-panel"><span className="security-icon">ⓘ</span><h2>{mode === "server" ? "Account security" : "Demo workspace security"}</h2>{mode === "server" ? <><p>Your password is stored as a one-way hash. Your business records are scoped to this account, and the sign-in session is held in an HTTP-only cookie.</p><p>Use a unique password of at least 12 characters. The demo workspace remains browser-only and is not affected by these account settings.</p></> : <><p>This preview stores demo records in this browser without account protection. Do not enter real customer or financial information in demo mode.</p><p>Create or sign in to a server account to keep business data in the API and database.</p><button className="secondary-action" onClick={() => { if (!window.confirm("Clear the demo data saved in this browser? The sample workspace will be restored after reload.")) return; Object.keys(localStorage).filter((key) => key.startsWith("mybillbuddy:")).forEach((key) => localStorage.removeItem(key)); window.location.reload(); }}>Reset demo data</button></>}</section> : loading ? <div className="empty-state"><h2>Loading account settings…</h2></div> : <form className="settings-form" onSubmit={save}>
          <h2>{tab === "Profile" ? "Profile information" : tab === "Business details" ? "Business information" : "In-app notification preferences"}</h2>
          {tab === "Profile" && <><label htmlFor="settings-name">Name</label><input id="settings-name" value={settings.name} onChange={(event) => update("name", event.target.value)} required /><label htmlFor="settings-email">Sign-in email</label><input id="settings-email" type="email" value={mode === "server" ? email : settings.email} onChange={(event) => update("email", event.target.value)} required readOnly={mode === "server"} /><label htmlFor="settings-mobile">Mobile number</label><input id="settings-mobile" type="tel" value={settings.mobile} onChange={(event) => update("mobile", event.target.value)} /></>}
          {tab === "Business details" && <><label htmlFor="settings-business">Business name</label><input id="settings-business" value={settings.business} onChange={(event) => update("business", event.target.value)} required /><label htmlFor="settings-gstin">GSTIN (optional)</label><input id="settings-gstin" value={settings.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} placeholder="15-character GST identification number" maxLength={15} pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]" /><label htmlFor="settings-currency">Display currency</label><select id="settings-currency" value={settings.currency} onChange={(event) => update("currency", event.target.value)}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></>}
          {tab === "Notifications" && <><p className="settings-help">Workspace alerts appear here. Reminder buttons prepare an email in your mail app; they do not send automatically.</p><div className="preference-list">{[["overdueReminders", "Overdue invoice reminders", "Show past-due balances on the dashboard and invoice list."], ["lowStockAlerts", "Low stock alerts", "Use each product’s reorder level."], ["paymentAlerts", "Payment updates", "Include payments in recent activity."]].map(([key, title, hint]) => <label className="preference-row" key={key}><span><strong>{title}</strong><small>{hint}</small></span><input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} /></label>)}</div></>}
          <div className="settings-save-row"><button className="real-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>{saved && <span role="status" className="save-success">✓ {mode === "server" ? "Saved to your account" : "Saved in this browser"}</span>}</div>
        </form>}
      </div>
    </section>
  </main></div>;
}

export default Settings;
