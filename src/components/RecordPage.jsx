import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { deleteServerRecord, exportCsv, invoiceBalance, invoiceStatus, loadServerCollection, money, saveServerRecord, today, useLocalCollection } from "../services/localData";

function RecordPage({ config }) {
  const [records, setRecords, mode, dataError, replaceRecords, loading] = useLocalCollection(config.collection);
  const [invoices, setInvoices, invoiceMode, invoiceError, replaceInvoices] = useLocalCollection("invoices");
  const [payments] = useLocalCollection("payments");
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [status, setStatus] = useState("All status");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setEditing(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editing]);

  const filtered = useMemo(() => records.filter((record) => {
    const matchesQuery = config.columns.some(({ key }) =>
      String(record[key] ?? "").toLowerCase().includes(query.toLowerCase()));
    const recordStatus = config.collection === "invoices" ? invoiceStatus(record, payments) : record.status;
    const matchesStatus = status === "All status" || recordStatus === status;
    return matchesQuery && matchesStatus;
  }), [records, payments, query, status, config.columns, config.collection]);

  const openNew = () => {
    const draft = Object.fromEntries(config.fields.map((field) => [field.key, field.defaultValue ?? (field.type === "date" ? today() : "")]));
    if (config.collection === "invoices") {
      const latest = Math.max(1042, ...records.map((item) => Number(item.invoiceNumber?.match(/\d+/)?.[0]) || 0));
      draft.invoiceNumber = `INV-${latest + 1}`;
      draft.status = "Pending";
    }
    setEditing({ ...draft, id: null });
  };

  const save = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft = Object.fromEntries(form.entries());
    config.fields.forEach(({ key, type }) => {
      if (type === "number") draft[key] = Number(draft[key] || 0);
    });
    if (config.collection === "payments" && (draft.status || "Completed") === "Completed") {
      const invoice = invoices.find((item) => item.invoiceNumber === draft.invoiceNumber);
      const alreadyPaid = payments.filter((item) => item.invoiceNumber === draft.invoiceNumber && item.status === "Completed" && String(item.id) !== String(editing.id)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      if (!invoice || draft.amount > Number(invoice.total) - alreadyPaid) {
        setNotice(`Payment exceeds this invoice's remaining balance of ${money(Math.max(0, Number(invoice?.total || 0) - alreadyPaid))}.`);
        return;
      }
    }
    setSaving(true);
    try {
      let nextRecords;
      if (mode === "server") {
        const saved = await saveServerRecord(config.collection, editing.id, draft);
        nextRecords = editing.id
          ? records.map((item) => String(item.id) === String(editing.id) ? saved : item)
          : [saved, ...records];
        replaceRecords(nextRecords);
        if (config.collection === "payments") replaceInvoices(await loadServerCollection("invoices"));
      } else {
        nextRecords = editing.id
          ? records.map((item) => item.id === editing.id ? { ...item, ...draft } : item)
          : [{ ...draft, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}` }, ...records];
        setRecords(nextRecords);
        if (config.collection === "payments") {
          setInvoices(invoices.map((invoice) => {
            const received = nextRecords.filter((payment) => payment.invoiceNumber === invoice.invoiceNumber && payment.status === "Completed").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            return { ...invoice, status: received >= Number(invoice.total) ? "Paid" : invoice.status === "Paid" ? "Pending" : invoice.status };
          }));
        }
      }
      setNotice(`${config.singular} ${editing.id ? "updated" : "added"}.`);
      setEditing(null);
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error) {
      setNotice(error.response?.data?.message || `Could not save this ${config.singular.toLowerCase()}. Check your API connection.`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    const location = mode === "server" ? "the server" : "this browser's demo data";
    if (!window.confirm(`Delete ${record[config.nameKey] || config.singular.toLowerCase()}? This removes it from ${location}.`)) return;
    try {
      if (mode === "server") {
        await deleteServerRecord(config.collection, record.id);
        replaceRecords(records.filter((item) => String(item.id) !== String(record.id)));
        if (config.collection === "payments") replaceInvoices(await loadServerCollection("invoices"));
      } else {
        const remaining = records.filter((item) => item.id !== record.id);
        setRecords(remaining);
        if (config.collection === "payments") {
          setInvoices(invoices.map((invoice) => {
            const received = remaining.filter((payment) => payment.invoiceNumber === invoice.invoiceNumber && payment.status === "Completed").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            return { ...invoice, status: received >= Number(invoice.total) ? "Paid" : invoice.status === "Paid" ? "Pending" : invoice.status };
          }));
        }
      }
      setNotice(`${config.singular} deleted.`);
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error) {
      setNotice(error.response?.data?.message || `Could not delete this ${config.singular.toLowerCase()}.`);
    }
  };

  const display = (column, record) => {
    const value = config.collection === "customers" && column.key === "totalDue"
      ? invoices.filter((invoice) => invoice.customerName === record.name).reduce((sum, invoice) => sum + invoiceBalance(invoice, payments), 0)
      : config.collection === "invoices" && column.key === "status" ? invoiceStatus(record, payments)
      : record[column.key];
    if (column.money) return money(value);
    if (column.status) return <span className={`status ${String(value).toLowerCase()}`}>{value}</span>;
    if (column.stock) return <span className={Number(value) < 10 ? "low-stock" : "stock"}>{value}</span>;
    return value || "—";
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-topbar">
          <label className="app-search-field"><span aria-hidden="true">⌕</span><input aria-label={`Search ${config.title.toLowerCase()}`} placeholder={`Search ${config.title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <span className="demo-user">{mode === "server" ? "Server account" : "Demo workspace"}</span>
        </div>
        <section className="management-page">
          <div className={`demo-notice ${mode === "server" && !dataError ? "server-notice" : ""}`}><span aria-hidden="true">{mode === "server" && !dataError ? "✓" : "ⓘ"}</span> {mode === "server" ? dataError ? "API connection needs attention" : "Connected workspace · Changes sync to your API" : "Local demo mode · Changes save in this browser only"}</div>
          {(dataError || (config.collection === "customers" && invoiceMode === "server" && invoiceError)) && <div className="api-error" role="alert">{dataError || invoiceError} Your changes are not being saved locally.</div>}
          <div className="page-heading">
            <div><h1>{config.title}</h1><p>{config.description} <span className="record-count">{records.length} total</span></p></div>
            <div className="page-actions">
              <button className="secondary-action" onClick={() => exportCsv(`${config.collection}.csv`, filtered, config.columns)} disabled={!filtered.length}>Export CSV</button>
              <button className="real-primary-button" onClick={openNew} disabled={loading}>＋ {config.action}</button>
            </div>
          </div>
          {config.statusOptions && <label className="filter-label">Status <select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option>{config.statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <div className="table-card responsive-table">
            {loading ? <div className="empty-state"><h2>Loading {config.title.toLowerCase()}…</h2></div> : filtered.length ? <table>
              <thead><tr>{config.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Actions</th></tr></thead>
              <tbody>{filtered.map((record) => <tr key={record.id}>
                {config.columns.map((column) => <td key={column.key} data-label={column.label}>{column.strong ? <strong>{display(column, record)}</strong> : display(column, record)}</td>)}
                <td className="record-actions" data-label="Actions"><button className="row-action" onClick={() => setEditing({ ...record })}>Edit</button><button className="delete-button" onClick={() => remove(record)}>Delete</button></td>
              </tr>)}</tbody>
            </table> : <div className="empty-state"><span>⌕</span><h2>{records.length ? "No matching records" : `No ${config.title.toLowerCase()} yet`}</h2><p>{records.length ? "Try a different search or status filter." : `Add your first ${config.singular.toLowerCase()} to get started.`}</p>{!records.length && <button className="real-primary-button" onClick={openNew}>＋ {config.action}</button>}</div>}
          </div>
          {notice && <div className="toast" role="status">✓ {notice}</div>}
        </section>
      </main>
      {editing && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
        <section className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
          <button className="dialog-close" aria-label="Close" onClick={() => setEditing(null)}>×</button>
          <span className="dialog-eyebrow">{editing.id ? "UPDATE DETAILS" : "ADD TO YOUR WORKSPACE"}</span>
          <h2 id="record-dialog-title">{editing.id ? `Edit ${config.singular}` : `New ${config.singular}`}</h2>
          <p>Complete the details below. You can edit this record later.</p>
          <form onSubmit={save} className="record-form">
            {config.fields.map((field) => <label key={field.key}>
              <span>{field.label}{field.required !== false && <b> *</b>}</span>
              {field.options ? <select name={field.key} defaultValue={editing[field.key] ?? (field.placeholder ? "" : field.options[0])} required={field.required !== false} onChange={(event) => { if (config.collection === "payments" && field.key === "invoiceNumber") { const invoice = invoices.find((item) => item.invoiceNumber === event.target.value); const customerField = event.currentTarget.form?.elements.namedItem("customerName"); if (customerField) customerField.value = invoice?.customerName || ""; } }}>{field.placeholder && <option value="" disabled>{field.placeholder}</option>}{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input name={field.key} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "any" : undefined} defaultValue={editing[field.key] ?? ""} required={field.required !== false} readOnly={field.readOnly} placeholder={field.placeholder || ""} />}
            </label>)}
            <div className="dialog-actions"><button type="button" className="secondary-action" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="real-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editing.id ? "Save changes" : `Add ${config.singular.toLowerCase()}`}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}

export default RecordPage;
