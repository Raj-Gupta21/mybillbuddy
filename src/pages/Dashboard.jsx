import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { invoiceBalance, invoiceStatus, money, readWorkspaceSettings, useLocalCollection } from "../services/localData";

function Dashboard() {
  const [invoices, , mode, invoiceError] = useLocalCollection("invoices");
  const [payments, , , paymentError] = useLocalCollection("payments");
  const [customers, , , customerError] = useLocalCollection("customers");
  const [products, , , productError] = useLocalCollection("products");
  const [settings] = React.useState(readWorkspaceSettings);
  const apiError = invoiceError || paymentError || customerError || productError;

  const totalSales = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const received = payments.filter((item) => item.status === "Completed").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice, payments), 0);
  const openInvoices = invoices.filter((invoice) => invoiceBalance(invoice, payments) > 0);
  const overdueInvoices = settings.overdueReminders ? openInvoices.filter((invoice) => invoiceStatus(invoice, payments) === "Overdue") : [];
  const lowStock = settings.lowStockAlerts ? products.filter((item) => Number(item.stock) < 10) : [];
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const date = day.toISOString().slice(0, 10);
    const sales = invoices.filter((invoice) => invoice.date === date).reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    return { date, label: day.toLocaleDateString("en-IN", { weekday: "short" }), sales };
  });
  const maxSale = Math.max(1, ...lastSevenDays.map((item) => item.sales));
  const activity = [
    ...invoices.map((item) => ({ date: item.date, name: item.customerName, description: `${item.invoiceNumber} · ${invoiceStatus(item, payments)}`, amount: item.total })),
    ...(settings.paymentAlerts ? payments.map((item) => ({ date: item.date, name: item.customerName, description: `Payment · ${item.method}`, amount: item.amount })) : []),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
  const [onboardingDone, setOnboardingDone] = React.useState(() => localStorage.getItem("mybillbuddy:onboarding") === "done");

  return <div className="app-layout">
    <Sidebar />
    <main className="app-main">
      <div className="app-topbar"><label className="app-search-field"><span aria-hidden="true">⌕</span><input aria-label="Search invoices" placeholder="Search invoices…" onKeyDown={(event) => { if (event.key === "Enter" && event.currentTarget.value.trim()) window.location.href = `/invoices?search=${encodeURIComponent(event.currentTarget.value.trim())}`; }} /></label><span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span></div>
      <div className="real-dashboard">
        <div className={`demo-notice ${mode === "server" && !apiError ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" && !apiError ? "✓" : "ⓘ"}</span> {mode === "server" ? apiError ? "API connection needs attention" : "Connected workspace · Dashboard uses your API data" : "Local demo mode · Your changes stay in this browser"}</div>
        {apiError && <div className="api-error" role="alert">{apiError} Server data could not be loaded.</div>}
        <div className="real-dashboard-heading"><div><span>Welcome to {settings.business || "your workspace"}</span><h1>Business overview</h1><p>Here’s what’s happening across your business.</p></div><Link className="real-primary-button" to="/invoices">＋ Create invoice</Link></div>
        {!onboardingDone && <section className="onboarding-card">
          <div className="onboarding-heading"><div><span className="dialog-eyebrow">YOUR FIRST STEPS</span><h2>Make this workspace yours</h2><p>Try a few actions to see how MyBillBuddy fits your day.</p></div><button className="dismiss-button" onClick={() => { localStorage.setItem("mybillbuddy:onboarding", "done"); setOnboardingDone(true); }}>Dismiss</button></div>
          <div className="onboarding-steps"><Link to="/customers"><span>01</span><strong>Add a customer</strong><small>Save contact details</small>→</Link><Link to="/inventory"><span>02</span><strong>Add a product</strong><small>Track stock levels</small>→</Link><Link to="/invoices"><span>03</span><strong>Create an invoice</strong><small>Record a sale</small>→</Link></div>
        </section>}
        <div className="real-stats-grid">
          <article className="real-stat-card"><div className="real-stat-icon blue">₹</div><div><span>Total invoiced</span><strong>{money(totalSales)}</strong><small>{invoices.length} invoices</small></div></article>
          <article className="real-stat-card"><div className="real-stat-icon green">✓</div><div><span>Payments received</span><strong>{money(received)}</strong><small>{payments.filter((item) => item.status === "Completed").length} completed payments</small></div></article>
          <article className="real-stat-card"><div className="real-stat-icon orange">!</div><div><span>Outstanding</span><strong>{money(outstanding)}</strong><small>{openInvoices.length} open invoices</small></div></article>
        </div>
        <div className="real-dashboard-grid">
          <section className="real-card"><div className="real-card-header"><div><small>INVOICES CREATED</small><h2>Last 7 days</h2></div><Link to="/reports">See reports →</Link></div><div className="real-chart">{lastSevenDays.map((item) => <div className="bar-wrapper" key={item.date} title={`${item.label}: ${money(item.sales)}`}><div className="chart-bar" style={{ height: `${Math.max(item.sales ? 8 : 2, (item.sales / maxSale) * 100)}%` }} /><span>{item.label}</span></div>)}</div><p className="chart-caption">{money(lastSevenDays.reduce((sum, item) => sum + item.sales, 0))} invoiced this week</p></section>
          <section className="real-card"><div className="real-card-header"><div><small>RECENT ACTIVITY</small><h2>Latest updates</h2></div><Link to="/payments">View payments →</Link></div>{activity.length ? activity.map((item, index) => <div className="real-transaction" key={`${item.description}-${index}`}><div className="transaction-avatar">{item.name?.slice(0, 2).toUpperCase() || "BB"}</div><div><strong>{item.name}</strong><small>{item.description} · {item.date}</small></div><b>{money(item.amount)}</b></div>) : <p className="empty-copy">Your new invoices and payments will show up here.</p>}</section>
        </div>
        {!!overdueInvoices.length && <section className="low-stock-banner"><span>!</span><div><strong>{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? "s" : ""}</strong><p>{overdueInvoices.map((item) => `${item.invoiceNumber} · ${money(invoiceBalance(item, payments))} due`).join(" · ")}</p></div><Link to="/invoices">Review invoices →</Link></section>}
        {!!lowStock.length && <section className="low-stock-banner"><span>⚠</span><div><strong>{lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low</strong><p>{lowStock.map((item) => `${item.name} (${item.stock})`).join(" · ")}</p></div><Link to="/inventory">Review stock →</Link></section>}
        <section className="quick-actions"><h2>Quick actions</h2><div><Link to="/customers">＋ Add customer</Link><Link to="/inventory">＋ Add product</Link><Link to="/payments">＋ Record payment</Link><Link to="/reports">↗ View reports</Link></div><p>Managing {customers.length} customers and {products.length} products</p></section>
      </div>
    </main>
  </div>;
}

export default Dashboard;
