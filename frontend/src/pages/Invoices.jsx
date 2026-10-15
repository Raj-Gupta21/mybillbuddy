import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { deleteServerRecord, exportCsv, invoiceBalance, invoiceStatus, money, saveServerRecord, today, useLocalCollection } from "../services/localData";

const asDate = (offset) => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); };
const newLine = () => ({ description: "", quantity: 1, unitPrice: 0, gstRate: 0 });
const lineBase = (line) => Number(line.quantity || 0) * Number(line.unitPrice || 0);
const invoiceTotals = (lines) => lines.reduce((sum, line) => {
  const base = lineBase(line);
  return { subtotal: sum.subtotal + base, tax: sum.tax + base * Number(line.gstRate || 0) / 100 };
}, { subtotal: 0, tax: 0 });
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function invoicePdf(invoice, customer, payments, business) {
  const lines = invoice.lineItems?.length ? invoice.lineItems : [{ description: "Invoice total", quantity: 1, unitPrice: invoice.total, gstRate: 0 }];
  const rows = [business, "TAX INVOICE", `Invoice: ${invoice.invoiceNumber}`, `Issue date: ${invoice.date}`, `Due date: ${invoice.dueDate || "Not specified"}`, `Bill to: ${customer?.name || invoice.customerName}`, `Phone: ${customer?.phone || "Not specified"}`, "", "Items:"];
  lines.forEach((line) => rows.push(`${line.description} | Qty ${line.quantity} | ${money(line.unitPrice)} each | GST ${line.gstRate || 0}% | ${money(lineBase(line) * (1 + Number(line.gstRate || 0) / 100))}`));
  const totals = invoiceTotals(lines);
  rows.push("", `Subtotal: ${money(totals.subtotal)}`, `GST: ${money(totals.tax)}`, `Total: ${money(totals.subtotal + totals.tax)}`, `Balance due: ${money(invoiceBalance(invoice, payments))}`);
  const escapePdf = (value) => String(value).normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
  const commands = ["BT", "/F1 11 Tf", "50 790 Td", "15 TL", ...rows.flatMap((row) => [`(${escapePdf(row)}) Tj`, "T*"]), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(commands).length} >>\nstream\n${commands}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], `${invoice.invoiceNumber}.pdf`, { type: "application/pdf" });
}

function printInvoice(invoice, customer, settings) {
  const windowRef = window.open("", "_blank");
  if (!windowRef) return;
  const lines = invoice.lineItems?.length ? invoice.lineItems : [{ description: "Invoice total", quantity: 1, unitPrice: invoice.total, gstRate: 0 }];
  const totals = invoiceTotals(lines);
  const taxRows = invoice.taxMode === "CGST_SGST"
    ? `<tr><th>CGST</th><td>${money(totals.tax / 2)}</td></tr><tr><th>SGST</th><td>${money(totals.tax / 2)}</td></tr>`
    : `<tr><th>IGST</th><td>${money(totals.tax)}</td></tr>`;
  windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(invoice.invoiceNumber)} · MyBillBuddy</title><style>
    *{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#172b4d;margin:0;padding:40px}main{max-width:800px;margin:auto}.top{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:24px}.brand{font-size:22px;font-weight:800;color:#1747b7}.muted{color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:28px 0}.items{width:100%;border-collapse:collapse;margin:26px 0}.items th,.items td{padding:11px;border-bottom:1px solid #e2e8f0;text-align:left}.items th:last-child,.items td:last-child{text-align:right}.totals{width:300px;margin-left:auto;border-collapse:collapse}.totals th,.totals td{padding:7px;text-align:right}.total{border-top:2px solid #172b4d;font-size:18px}.foot{margin-top:50px;border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b}@media print{body{padding:0}@page{margin:16mm}}
  </style></head><body><main><div class="top"><div><div class="brand">${safe(settings.business || "MyBillBuddy")}</div><div>${safe(settings.name || "")}</div><div>${safe(settings.mobile || "")}</div>${settings.gstin ? `<div>GSTIN: ${safe(settings.gstin)}</div>` : ""}</div><div><h1>TAX INVOICE</h1><div><b>Invoice:</b> ${safe(invoice.invoiceNumber)}</div><div><b>Issue date:</b> ${safe(invoice.date)}</div><div><b>Due date:</b> ${safe(invoice.dueDate || "—")}</div></div></div><div class="grid"><div><b>Bill to</b><div>${safe(customer?.name || invoice.customerName)}</div><div>${safe(customer?.address || "")}</div><div>${safe(customer?.email || "")}</div><div>${safe(customer?.phone || "")}</div>${customer?.gstin ? `<div>GSTIN: ${safe(customer.gstin)}</div>` : ""}</div><div><b>Tax treatment</b><div>${invoice.taxMode === "CGST_SGST" ? "CGST + SGST" : "IGST"}</div></div></div><table class="items"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>GST</th><th>Total</th></tr></thead><tbody>${lines.map((line) => `<tr><td>${safe(line.description)}</td><td>${safe(line.quantity)}</td><td>${money(line.unitPrice)}</td><td>${safe(line.gstRate)}%</td><td>${money(lineBase(line) * (1 + Number(line.gstRate || 0) / 100))}</td></tr>`).join("")}</tbody></table><table class="totals"><tr><th>Subtotal</th><td>${money(totals.subtotal)}</td></tr>${taxRows}<tr class="total"><th>Total</th><td>${money(totals.subtotal + totals.tax)}</td></tr><tr><th>Balance due</th><td>${money(invoiceBalance(invoice, settings.payments || []))}</td></tr></table><div class="foot">Generated with MyBillBuddy. Verify tax treatment and invoice details before issuing.</div></main><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  windowRef.document.close();
}

function Invoices() {
  const [invoices, setInvoices, mode, error, replaceInvoices, loading] = useLocalCollection("invoices");
  const [customers] = useLocalCollection("customers");
  const [products, setProducts] = useLocalCollection("products");
  const [payments] = useLocalCollection("payments");
  const [stockMovements, setStockMovements] = useLocalCollection("stockMovements");
  const [messageLogs, setMessageLogs] = useState(() => { try { return JSON.parse(localStorage.getItem("mybillbuddy:invoiceMessages") || "[]"); } catch { return []; } });
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [status, setStatus] = useState("All status");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => invoices.filter((invoice) => {
    const matches = [invoice.invoiceNumber, invoice.customerName, invoice.date].some((value) => String(value || "").toLowerCase().includes(query.toLowerCase()));
    return matches && (status === "All status" || invoiceStatus(invoice, payments) === status);
  }), [invoices, payments, query, status]);
  const openNew = () => {
    const latest = Math.max(1042, ...invoices.map((item) => Number(item.invoiceNumber?.match(/\d+/)?.[0]) || 0));
    setEditing({ id: null, invoiceNumber: `INV-${latest + 1}`, customerName: "", date: today(), dueDate: asDate(14), taxMode: "IGST", lineItems: [newLine()] });
  };
  const openEdit = (invoice) => setEditing({ ...invoice, dueDate: invoice.dueDate || asDate(14), taxMode: invoice.taxMode || "IGST", lineItems: invoice.lineItems?.length ? invoice.lineItems.map((line) => ({ ...line })) : [{ description: "Invoice total", quantity: 1, unitPrice: invoice.total || 0, gstRate: 0 }] });
  const updateLine = (index, key, value) => setEditing((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: key === "description" ? value : Number(value) } : line) }));
  const selectProduct = (index, productId) => {
    const product = products.find((item) => String(item.id) === productId);
    setEditing((current) => ({ ...current, lineItems: current.lineItems.map((line, lineIndex) => lineIndex === index ? {
      ...line,
      productId: product ? product.id : null,
      description: product ? `${product.name}${product.variant ? ` (${product.variant})` : ""}` : "",
      unitPrice: product ? Number(product.price || 0) : 0,
    } : line) }));
  };
  const save = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(form.entries());
    const customer = customers.find((item) => item.name === fields.customerName);
    const lines = editing.lineItems.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), gstRate: Number(line.gstRate) }));
    if (!customer) { setNotice("Choose a customer from your customer list."); return; }
    if (!lines.length || lines.some((line) => !line.description.trim() || line.quantity <= 0 || line.unitPrice < 0)) { setNotice("Add a description, positive quantity and non-negative unit price for every item."); return; }
    const totals = invoiceTotals(lines);
    const previousInvoice = editing.id ? invoices.find((item) => String(item.id) === String(editing.id)) : null;
    const stockDeltas = new Map();
    const collectStock = (items, multiplier) => items.forEach((line) => {
      const product = products.find((item) => (line.productId != null && String(item.id) === String(line.productId)) || `${String(item.name).trim()}${item.variant ? ` (${item.variant})` : ""}`.toLowerCase() === String(line.description).trim().toLowerCase());
      if (product) stockDeltas.set(String(product.id), (stockDeltas.get(String(product.id)) || 0) + Number(line.quantity || 0) * multiplier);
    });
    if (mode === "demo") {
      if (previousInvoice?.inventoryAdjusted) collectStock(previousInvoice.lineItems || [], 1);
      collectStock(lines, -1);
      const insufficient = products.find((product) => Number(product.stock) + (stockDeltas.get(String(product.id)) || 0) < 0);
      if (insufficient) { setNotice(`Not enough ${insufficient.name} in stock. Available: ${insufficient.stock}.`); return; }
    }
    const draft = { invoiceNumber: fields.invoiceNumber.trim(), customerName: fields.customerName, date: fields.date, dueDate: fields.dueDate, taxMode: fields.taxMode, lineItems: lines, subtotal: totals.subtotal, taxAmount: totals.tax, total: totals.subtotal + totals.tax, status: "Pending", ...(mode === "demo" ? { inventoryAdjusted: true } : {}) };
    setSaving(true);
    try {
      const saved = mode === "server" ? await saveServerRecord("invoices", editing.id, draft) : { ...draft, id: editing.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}` };
      const next = editing.id ? invoices.map((item) => String(item.id) === String(editing.id) ? saved : item) : [saved, ...invoices];
      if (mode === "server") replaceInvoices(next); else setInvoices(next);
      if (mode === "demo" && stockDeltas.size) setProducts(products.map((product) => ({ ...product, stock: Number(product.stock) + (stockDeltas.get(String(product.id)) || 0) })));
      if (mode === "demo" && stockDeltas.size) setStockMovements([...Array.from(stockDeltas.entries()).filter(([, change]) => change).map(([productId, quantityChange]) => {
        const product = products.find((item) => String(item.id) === productId);
        return { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${productId}`, productId: product?.id, productName: product?.name || "Product", variant: product?.variant || "", quantityChange, reason: `Invoice ${draft.invoiceNumber}${editing.id ? " updated" : ""}`, createdAt: new Date().toISOString() };
      }), ...stockMovements]);
      setEditing(null); setNotice(`Invoice ${editing.id ? "updated" : "created"}.`); window.setTimeout(() => setNotice(""), 2800);
    } catch (requestError) { setNotice(requestError.response?.data?.message || "Could not save this invoice. Check the API connection."); }
    finally { setSaving(false); }
  };
  const remove = async (invoice) => {
    if (payments.some((payment) => payment.invoiceNumber === invoice.invoiceNumber)) { setNotice("This invoice has payment history. Refund or correct the payment instead of deleting the invoice."); return; }
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    try {
      if (mode === "server") await deleteServerRecord("invoices", invoice.id);
      if (mode === "demo" && invoice.inventoryAdjusted) {
        const stockDeltas = new Map();
        (invoice.lineItems || []).forEach((line) => {
          const product = products.find((item) => (line.productId != null && String(item.id) === String(line.productId)) || `${String(item.name).trim()}${item.variant ? ` (${item.variant})` : ""}`.toLowerCase() === String(line.description).trim().toLowerCase());
          if (product) stockDeltas.set(String(product.id), (stockDeltas.get(String(product.id)) || 0) + Number(line.quantity || 0));
        });
        setProducts(products.map((product) => ({ ...product, stock: Number(product.stock) + (stockDeltas.get(String(product.id)) || 0) })));
        setStockMovements([...Array.from(stockDeltas.entries()).map(([productId, quantityChange]) => {
          const product = products.find((item) => String(item.id) === productId);
          return { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${productId}`, productId: product?.id, productName: product?.name || "Product", variant: product?.variant || "", quantityChange, reason: `Invoice ${invoice.invoiceNumber} deleted`, createdAt: new Date().toISOString() };
        }), ...stockMovements]);
      }
      const next = invoices.filter((item) => String(item.id) !== String(invoice.id));
      if (mode === "server") replaceInvoices(next); else setInvoices(next);
      setNotice("Invoice deleted.");
    } catch (requestError) { setNotice(requestError.response?.data?.message || "Could not delete this invoice."); }
  };
  const print = (invoice) => {
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem("mybillbuddy:settings") || "{}"); } catch { /* Use default invoice branding when browser storage is unavailable. */ }
    printInvoice(invoice, customers.find((item) => item.name === invoice.customerName), { ...settings, payments });
  };
  const sendWhatsApp = async (invoice, kind) => {
    const customer = customers.find((item) => item.name === invoice.customerName);
    const digits = String(customer?.phone || "").replace(/\D/g, "");
    if (!digits) { setNotice(`Add a phone number for ${customer?.name || invoice.customerName} before sharing on WhatsApp.`); return; }
    const balance = invoiceBalance(invoice, payments);
    let business = "MyBillBuddy";
    try { business = JSON.parse(localStorage.getItem("mybillbuddy:settings") || "{}").business || business; } catch { /* Keep default business name. */ }
    const reminder = kind === "Reminder";
    const pdf = invoicePdf(invoice, customer, payments, business);
    const body = reminder
      ? `Hello ${customer?.name || ""},\n\nA friendly reminder that invoice ${invoice.invoiceNumber} has an outstanding balance of ${money(balance)}. The due date was ${invoice.dueDate || "not specified"}. Please see the attached bill.\n\nPlease let us know if you have already made this payment.\n\nRegards, ${business}`
      : `Hello ${customer?.name || ""},\n\nPlease find attached the bill for invoice ${invoice.invoiceNumber}.\nInvoice total: ${money(invoice.total)}\nBalance due: ${money(balance)}\nDue date: ${invoice.dueDate || "not specified"}\n\nRegards, ${business}`;
    const entry = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`, invoiceId: String(invoice.id), invoiceNumber: invoice.invoiceNumber, customerName: customer?.name || invoice.customerName, phone: customer.phone, kind, sentAt: new Date().toISOString(), message: body, status: "Prepared" };
    const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
    if (navigator.canShare?.({ files: [pdf] }) && navigator.share) {
      try {
        await navigator.share({ files: [pdf], title: `${invoice.invoiceNumber} bill`, text: body });
        entry.status = "Shared from device";
        setNotice(`Bill ${invoice.invoiceNumber} was passed to your device share sheet. Choose WhatsApp to send it.`);
      } catch (shareError) {
        if (shareError.name === "AbortError") { setNotice("Sharing cancelled. No message was sent."); return; }
        entry.status = "PDF downloaded; WhatsApp opened";
        const url = URL.createObjectURL(pdf);
        const link = document.createElement("a"); link.href = url; link.download = pdf.name; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setNotice(`Bill downloaded as ${pdf.name}. Attach it in WhatsApp before sending.`);
      }
    } else {
      entry.status = "PDF downloaded; WhatsApp opened";
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a"); link.href = url; link.download = pdf.name; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setNotice(`Bill downloaded as ${pdf.name}. Attach it in WhatsApp before sending.`);
    }
    const nextLogs = [entry, ...messageLogs];
    setMessageLogs(nextLogs);
    try { localStorage.setItem("mybillbuddy:invoiceMessages", JSON.stringify(nextLogs)); } catch { /* Keep the current in-memory history if storage is unavailable. */ }
  };
  const messageHistory = (invoice) => {
    const entries = messageLogs.filter((entry) => entry.invoiceId === String(invoice.id));
    if (!entries.length) { setNotice(`No WhatsApp messages recorded for ${invoice.invoiceNumber}.`); return; }
    setNotice(`${entries.length} WhatsApp ${entries.length === 1 ? "message" : "messages"} recorded for ${invoice.invoiceNumber}. Latest: ${new Date(entries[0].sentAt).toLocaleString()} (${entries[0].kind}; delivery not confirmed).`);
  };
  const totals = editing ? invoiceTotals(editing.lineItems || []) : { subtotal: 0, tax: 0 };

  return <div className="app-layout"><Sidebar /><main className="app-main">
    <div className="app-topbar"><label className="app-search-field"><span aria-hidden="true">⌕</span><input aria-label="Search invoices" placeholder="Search invoices..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span></div>
    <section className="management-page"><div className={`demo-notice ${mode === "server" && !error ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" && !error ? "✓" : "ⓘ"}</span> {mode === "server" ? error ? "API connection needs attention" : "Connected workspace · Invoices sync to your API" : "Local demo mode · Changes save in this browser only"}</div>{error && <div className="api-error" role="alert">{error} Invoice changes are not being saved.</div>}
      <div className="page-heading"><div><h1>Invoices</h1><p>Create, track and collect itemized invoices. <span className="record-count">{filtered.length} total</span></p></div><div className="page-actions"><button className="secondary-action" onClick={() => exportCsv("invoices.csv", filtered.map((invoice) => ({ ...invoice, balance: invoiceBalance(invoice, payments), status: invoiceStatus(invoice, payments) })), [{ key: "invoiceNumber", label: "Invoice" }, { key: "customerName", label: "Customer" }, { key: "date", label: "Issue date" }, { key: "dueDate", label: "Due date" }, { key: "subtotal", label: "Subtotal" }, { key: "taxAmount", label: "GST" }, { key: "total", label: "Total" }, { key: "balance", label: "Balance due" }, { key: "status", label: "Status" }])} disabled={!filtered.length}>Export CSV</button><button className="real-primary-button" onClick={openNew} disabled={loading || !customers.length}>＋ Create invoice</button></div></div>
      {!customers.length && <div className="api-error">Add a customer before creating an invoice. <a href="/customers">Open customers →</a></div>}
      <label className="filter-label">Status <select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option><option>Paid</option><option>Pending</option><option>Overdue</option></select></label>
      <div className="table-card responsive-table">{loading ? <div className="empty-state"><h2>Loading invoices…</h2></div> : filtered.length ? <table><thead><tr>{["Invoice", "Customer", "Issue date", "Due date", "Total", "Balance due", "Status", "Actions"].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{filtered.map((invoice) => <tr key={invoice.id}><td data-label="Invoice"><strong>{invoice.invoiceNumber}</strong></td><td data-label="Customer">{invoice.customerName}</td><td data-label="Issue date">{invoice.date}</td><td data-label="Due date">{invoice.dueDate || "—"}</td><td data-label="Total">{money(invoice.total)}</td><td data-label="Balance due">{money(invoiceBalance(invoice, payments))}</td><td data-label="Status"><span className={`status ${invoiceStatus(invoice, payments).toLowerCase()}`}>{invoiceStatus(invoice, payments)}</span></td><td className="record-actions" data-label="Actions"><button className="row-action" aria-label={`Edit ${invoice.invoiceNumber}`} onClick={() => openEdit(invoice)}>Edit</button><button className="row-action" aria-label={`Print ${invoice.invoiceNumber}`} onClick={() => print(invoice)}>PDF</button><button className="row-action" aria-label={`Share ${invoice.invoiceNumber}`} onClick={() => sendWhatsApp(invoice, "Invoice")}>WhatsApp</button><button className="row-action" aria-label={`Message history ${invoice.invoiceNumber}`} onClick={() => messageHistory(invoice)}>History{messageLogs.some((entry) => entry.invoiceId === String(invoice.id)) ? ` (${messageLogs.filter((entry) => entry.invoiceId === String(invoice.id)).length})` : ""}</button>{invoiceStatus(invoice, payments) === "Overdue" && invoiceBalance(invoice, payments) > 0 && <button className="row-action" onClick={() => sendWhatsApp(invoice, "Reminder")}>Remind</button>}<button className="delete-button" aria-label={`Delete ${invoice.invoiceNumber}`} onClick={() => remove(invoice)}>Delete</button></td></tr>)}</tbody></table> : <div className="empty-state"><span>▤</span><h2>{invoices.length ? "No matching invoices" : "No invoices yet"}</h2><p>{invoices.length ? "Try another search or status filter." : "Create your first itemized invoice to get started."}</p>{!invoices.length && customers.length > 0 && <button className="real-primary-button" onClick={openNew}>＋ Create invoice</button>}</div>}</div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </section>
  </main>
  {editing && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null); }}><section className="record-dialog invoice-dialog" role="dialog" aria-modal="true" aria-labelledby="invoice-dialog-title"><button className="dialog-close" aria-label="Close" onClick={() => !saving && setEditing(null)}>×</button><span className="dialog-eyebrow">ITEMIZED BILLING</span><h2 id="invoice-dialog-title">{editing.id ? "Edit invoice" : "New invoice"}</h2><p>Choose a customer, add items and set tax per item.</p>
    <form className="record-form invoice-form" onSubmit={save}><div className="invoice-meta-grid"><label><span>Invoice number *</span><input name="invoiceNumber" defaultValue={editing.invoiceNumber} required /></label><label><span>Customer *</span><select name="customerName" defaultValue={editing.customerName} required><option value="" disabled>Choose a customer</option>{customers.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}</select></label><div className="invoice-date-grid"><label><span>Issue date *</span><input name="date" type="date" defaultValue={editing.date} required /></label><label><span>Due date *</span><input name="dueDate" type="date" min={editing.date} defaultValue={editing.dueDate} required /></label></div></div>
      <div className="invoice-lines-heading"><strong>Items</strong><button className="row-action" type="button" onClick={() => setEditing((current) => ({ ...current, lineItems: [...current.lineItems, newLine()] }))}>＋ Add item</button></div>
      {editing.lineItems.map((line, index) => <div className="invoice-line-editor" key={index}>{products.length > 0 && <label><span>Choose a product</span><select value={line.productId || ""} onChange={(event) => selectProduct(index, event.target.value)}><option value="">Select from inventory or enter manually</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.variant ? ` · ${product.variant}` : ""} · {money(product.price)} · {product.stock} in stock</option>)}</select></label>}<label><span>Description *</span><input value={line.description} onChange={(event) => updateLine(index, "description", event.target.value)} required /></label><div className="invoice-line-grid"><label><span>Qty *</span><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} required /></label><label><span>Unit price *</span><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateLine(index, "unitPrice", event.target.value)} required /></label><label><span>GST rate</span><select value={line.gstRate} onChange={(event) => updateLine(index, "gstRate", event.target.value)}>{[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></label>{editing.lineItems.length > 1 && <button className="delete-button" type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setEditing((current) => ({ ...current, lineItems: current.lineItems.filter((_, lineIndex) => lineIndex !== index) }))}>Remove</button>}</div></div>)}
      <label><span>GST calculation</span><select name="taxMode" defaultValue={editing.taxMode}><option value="IGST">IGST (inter-state)</option><option value="CGST_SGST">CGST + SGST (within state)</option></select></label><p className="invoice-tax-note">Tax is calculated from each item’s GST rate. Confirm the right tax treatment and GSTINs before issuing an invoice.</p><div className="invoice-total-preview"><span>Subtotal</span><strong>{money(totals.subtotal)}</strong><span>GST</span><strong>{money(totals.tax)}</strong><span>Total</span><strong>{money(totals.subtotal + totals.tax)}</strong></div><div className="dialog-actions"><button type="button" className="secondary-action" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="real-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editing.id ? "Save invoice" : "Create invoice"}</button></div>
    </form></section></div>}
  </div>;
}

export default Invoices;
