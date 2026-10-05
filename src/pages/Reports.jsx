import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { exportCsv, invoiceBalance, money, useLocalCollection } from "../services/localData";

function Reports() {
  const [invoices, , mode, invoiceError] = useLocalCollection("invoices");
  const [payments, , , paymentError] = useLocalCollection("payments");
  const apiError = invoiceError || paymentError;
  const [period, setPeriod] = useState("7");
  const totalSales = invoices.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const received = payments.filter((item) => item.status === "Completed").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice, payments), 0);
  const bars = useMemo(() => {
    const days = Number(period);
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const endOffset = Math.round((6 - index) * days / 6);
      const startOffset = Math.round((6 - index + 1) * days / 6);
      const end = new Date(now); end.setDate(now.getDate() - endOffset);
      const start = new Date(now); start.setDate(now.getDate() - startOffset + 1);
      const sum = invoices.filter((item) => {
        const date = new Date(`${item.date}T00:00:00`);
        return date >= start && date <= end;
      }).reduce((total, item) => total + Number(item.total || 0), 0);
      return { label: days === 7 ? end.toLocaleDateString("en-IN", { weekday: "short" }) : end.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), sum };
    });
  }, [invoices, period]);
  const max = Math.max(1, ...bars.map((item) => item.sum));

  return <div className="app-layout"><Sidebar /><main className="app-main">
    <div className="app-topbar"><span className="app-topbar-title">Sales and collections</span><span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span></div>
    <section className="management-page">
      <div className={`demo-notice ${mode === "server" && !apiError ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" && !apiError ? "✓" : "ⓘ"}</span> {mode === "server" ? apiError ? "API connection needs attention" : "Connected workspace · Reports use your API data" : "Local demo mode · Report figures use data saved in this browser"}</div>
      {apiError && <div className="api-error" role="alert">{apiError} Server report data could not be loaded.</div>}
      <div className="page-heading"><div><h1>Reports</h1><p>Understand sales, collections and open balances.</p></div><div className="page-actions"><label className="filter-label">Period <select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="365">This year</option></select></label><button className="secondary-action" onClick={() => exportCsv("mybillbuddy-sales-report.csv", invoices, [{ key: "invoiceNumber", label: "Invoice" }, { key: "customerName", label: "Customer" }, { key: "date", label: "Date" }, { key: "total", label: "Amount" }, { key: "status", label: "Status" }])}>Export CSV</button></div></div>
      <div className="report-grid"><article className="report-card"><span>Total invoiced</span><strong>{money(totalSales)}</strong><small>{invoices.length} invoices</small></article><article className="report-card"><span>Received</span><strong>{money(received)}</strong><small>{payments.filter((item) => item.status === "Completed").length} completed payments</small></article><article className="report-card"><span>Outstanding</span><strong>{money(outstanding)}</strong><small>{invoices.filter((item) => invoiceBalance(item, payments) > 0).length} open invoices</small></article></div>
      <div className="table-card report-table"><div className="report-chart-heading"><div><span className="dialog-eyebrow">SALES OVERVIEW</span><h2>Invoices over time</h2></div><span className="chart-total">{money(bars.reduce((sum, item) => sum + item.sum, 0))}</span></div><div className="large-report-chart">{bars.map((item, index) => <div className="report-bar-wrapper" key={`${item.label}-${index}`} title={`${item.label}: ${money(item.sum)}`}><div className="report-bar" style={{ height: `${Math.max(item.sum ? 6 : 2, item.sum / max * 100)}%` }} /><span>{item.label}</span></div>)}</div><p className="chart-caption">Chart totals update from your invoices and selected period.</p></div>
    </section>
  </main></div>;
}

export default Reports;
