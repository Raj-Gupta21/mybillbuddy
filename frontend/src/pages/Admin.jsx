import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState({ supportEmail: "", announcement: "", registrationOpen: true });
  const load = useCallback(() => api.get("/admin/overview").then(({ data: result }) => { setData(result); setSite(result.settings); }).catch((e) => setError(e.response?.data?.message || "Could not load admin console.")), []);
  useEffect(() => { load(); }, [load]);
  const toggle = async (account) => {
    setBusy(true); setError("");
    try { await api.patch(`/admin/accounts/${account.id}/enabled`, { enabled: !account.enabled }); await load(); setNotice(`${account.username} ${account.enabled ? "disabled" : "enabled"}.`); }
    catch (e) { setError(e.response?.data?.message || "Could not update account."); }
    finally { setBusy(false); }
  };
  const reset = async (account) => {
    if (!window.confirm(`Create a temporary password for ${account.username}? Share it with them through a trusted channel.`)) return;
    setBusy(true); setError("");
    try { const { data: result } = await api.post(`/admin/accounts/${account.id}/reset-password`); setNotice(`Temporary password for ${result.username}: ${result.temporaryPassword}`); await load(); }
    catch (e) { setError(e.response?.data?.message || "Could not reset password."); }
    finally { setBusy(false); }
  };
  const saveSite = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const { data: settings } = await api.put("/admin/settings", site); setSite(settings); setNotice("Site-wide settings saved."); await load(); }
    catch (e) { setError(e.response?.data?.message || "Could not save site settings."); }
    finally { setBusy(false); }
  };
  return <div className="app-layout"><Sidebar /><main className="app-main"><div className="app-topbar"><span className="app-topbar-title">Site administration</span><span className="demo-user">Administrator</span></div><section className="management-page"><div className="demo-notice server-notice"><span>✓</span> Owner-only console · Changes apply to the whole site</div><div className="page-heading"><div><h1>Admin</h1><p>Manage accounts, support access, service status and site settings.</p></div></div>{error && <div className="api-error" role="alert">{error}</div>}{notice && <div className="toast" role="status">{notice}</div>}
    {!data ? <div className="empty-state"><h2>Loading admin console…</h2></div> : <>
      <div className="admin-health-grid">{[["API", data.health.api], ["Database", data.health.database], ["Accounts", data.accounts.length]].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="table-card responsive-table"><h2 className="admin-section-title">User accounts</h2><table><thead><tr>{["User", "Business", "Joined", "Last sign in", "Status", "Actions"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{data.accounts.map((account) => <tr key={account.id}><td data-label="User">{account.name}<br /><small>{account.username}</small></td><td data-label="Business">{account.businessName}</td><td data-label="Joined">{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}</td><td data-label="Last sign in">{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "Never recorded"}</td><td data-label="Status"><span className={`status ${account.enabled ? "paid" : "overdue"}`}>{account.enabled ? "Active" : "Disabled"}</span></td><td className="record-actions" data-label="Actions"><button className="row-action" disabled={busy} onClick={() => toggle(account)}>{account.enabled ? "Disable" : "Enable"}</button><button className="row-action" disabled={busy} onClick={() => reset(account)}>Reset password</button></td></tr>)}</tbody></table></div>
      <div className="admin-panels"><section className="settings-panel"><span className="dialog-eyebrow">SITE CONFIGURATION</span><h2>Global settings</h2><form className="settings-form" onSubmit={saveSite}><label htmlFor="admin-support">Support email</label><input id="admin-support" type="email" value={site.supportEmail || ""} onChange={(e) => setSite({ ...site, supportEmail: e.target.value })} placeholder="support@example.com" /><label htmlFor="admin-announcement">Site announcement</label><textarea id="admin-announcement" rows="3" value={site.announcement || ""} onChange={(e) => setSite({ ...site, announcement: e.target.value })} placeholder="Optional notice for users" /><label className="preference-row"><span><strong>Allow new registrations</strong><small>Turn off to close sign-ups.</small></span><input type="checkbox" checked={Boolean(site.registrationOpen)} onChange={(e) => setSite({ ...site, registrationOpen: e.target.checked })} /></label><button className="real-primary-button" disabled={busy}>Save site settings</button></form></section>
      <section className="settings-panel"><span className="dialog-eyebrow">RECENT ACCOUNT ACTIVITY</span><h2>Sign-ins</h2>{data.activity.length ? <ul className="admin-activity">{data.activity.map((item, index) => <li key={`${item.username}-${index}`}><strong>{item.username}</strong><span>{new Date(item.at).toLocaleString()}</span></li>)}</ul> : <p>No sign-ins have been recorded yet.</p>}<p className="settings-help">Service check: {new Date(data.health.checkedAt).toLocaleString()}.</p></section></div>
    </>}</section></main></div>;
}

export default Admin;
