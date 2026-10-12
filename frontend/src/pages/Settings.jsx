import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { readWorkspaceSettings, saveWorkspaceSettings } from "../services/localData";

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
  const tabs = ["Profile", "Business details", "Notifications", "Security"];

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

  return <div className="app-layout"><Sidebar /><main className="app-main">
    <div className="app-topbar"><span className="app-topbar-title">Workspace preferences</span><span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span></div>
    <section className="management-page"><div className={`demo-notice ${mode === "server" ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" ? "✓" : "ⓘ"}</span> {mode === "server" ? "Account settings sync to your API" : "Demo preferences are saved in this browser"}</div>{error && <div className="api-error" role="alert">{error}</div>}
      <div className="page-heading"><div><h1>Settings</h1><p>Set up the workspace around your business.</p></div></div>
      <div className="settings-card"><div className="settings-tabs" role="tablist" aria-label="Settings categories">{tabs.map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div>
        {tab === "Security" ? <section className="settings-panel"><span className="security-icon">ⓘ</span><h2>{mode === "server" ? "Account security" : "Demo workspace security"}</h2>{mode === "server" ? <><p>Your password is stored as a one-way hash. Your business records are scoped to this account, and the sign-in session is held in an HTTP-only cookie.</p><p>Use a unique password of at least 12 characters. The demo workspace remains browser-only and is not affected by these account settings.</p></> : <><p>This preview stores demo records in this browser without account protection. Do not enter real customer or financial information in demo mode.</p><p>Create or sign in to a server account to keep business data in the API and database.</p><button className="secondary-action" onClick={() => { if (!window.confirm("Clear the demo data saved in this browser? The sample workspace will be restored after reload.")) return; Object.keys(localStorage).filter((key) => key.startsWith("mybillbuddy:")).forEach((key) => localStorage.removeItem(key)); window.location.reload(); }}>Reset demo data</button></>}</section> : loading ? <div className="empty-state"><h2>Loading account settings…</h2></div> : <form className="settings-form" onSubmit={save}>
          <h2>{tab === "Profile" ? "Profile information" : tab === "Business details" ? "Business information" : "In-app notification preferences"}</h2>
          {tab === "Profile" && <><label htmlFor="settings-name">Name</label><input id="settings-name" value={settings.name} onChange={(event) => update("name", event.target.value)} required /><label htmlFor="settings-email">Sign-in email</label><input id="settings-email" type="email" value={mode === "server" ? email : settings.email} onChange={(event) => update("email", event.target.value)} required readOnly={mode === "server"} /><label htmlFor="settings-mobile">Mobile number</label><input id="settings-mobile" type="tel" value={settings.mobile} onChange={(event) => update("mobile", event.target.value)} /></>}
          {tab === "Business details" && <><label htmlFor="settings-business">Business name</label><input id="settings-business" value={settings.business} onChange={(event) => update("business", event.target.value)} required /><label htmlFor="settings-gstin">GSTIN (optional)</label><input id="settings-gstin" value={settings.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} placeholder="15-character GST identification number" maxLength={15} pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]" /><label htmlFor="settings-currency">Display currency</label><select id="settings-currency" value={settings.currency} onChange={(event) => update("currency", event.target.value)}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></>}
          {tab === "Notifications" && <><p className="settings-help">These alerts appear inside your workspace. Email and SMS delivery is not configured.</p><div className="preference-list">{[["overdueReminders", "Overdue invoice reminders", "Show past-due balances on the dashboard."], ["lowStockAlerts", "Low stock alerts", "Show products with fewer than 10 units."], ["paymentAlerts", "Payment updates", "Include payments in recent activity."]].map(([key, title, hint]) => <label className="preference-row" key={key}><span><strong>{title}</strong><small>{hint}</small></span><input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} /></label>)}</div></>}
          <div className="settings-save-row"><button className="real-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>{saved && <span role="status" className="save-success">✓ {mode === "server" ? "Saved to your account" : "Saved in this browser"}</span>}</div>
        </form>}
      </div>
    </section>
  </main></div>;
}

export default Settings;
