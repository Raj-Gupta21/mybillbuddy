import React from "react";
import api from "./api";

const eventName = "mybillbuddy:data-changed";
const defaultSettings = { name: "Arjun", email: "arjun@example.com", mobile: "+91 98765 43210", business: "Arjun's Store", gstin: "", currency: "INR", overdueReminders: true, lowStockAlerts: true, paymentAlerts: true };

export function readWorkspaceSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("mybillbuddy:settings") || "{}");
    const settings = { ...defaultSettings, ...stored };
    settings.currency = String(settings.currency || "INR").slice(0, 3).toUpperCase();
    return settings;
  } catch { return { ...defaultSettings }; }
}

export function saveWorkspaceSettings(settings) {
  localStorage.setItem("mybillbuddy:settings", JSON.stringify({ ...settings, currency: String(settings.currency || "INR").slice(0, 3).toUpperCase() }));
}

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const seeds = {
  customers: [
    { id: "c-1", name: "Rahul Enterprises", phone: "+91 98765 43210", email: "rahul@example.com", address: "Mumbai, Maharashtra", gstin: "", totalDue: 12000 },
    { id: "c-2", name: "Mehta Stores", phone: "+91 98765 43211", email: "mehta@example.com", address: "Pune, Maharashtra", gstin: "", totalDue: 8500 },
    { id: "c-3", name: "Priya Kitchen", phone: "+91 98765 43212", email: "priya@example.com", address: "Bengaluru, Karnataka", gstin: "", totalDue: 5000 },
  ],
  products: [
    { id: "p-1", name: "Laptop", category: "Electronics", stock: 25, price: 45000 },
    { id: "p-2", name: "Wireless mouse", category: "Electronics", stock: 8, price: 1200 },
    { id: "p-3", name: "Office chair", category: "Furniture", stock: 15, price: 5500 },
  ],
  invoices: [
    { id: "i-1", invoiceNumber: "INV-1042", customerName: "Rahul Enterprises", date: dateOffset(-1), dueDate: dateOffset(13), subtotal: 18500, taxAmount: 0, taxMode: "IGST", lineItems: [{ description: "Business services", quantity: 1, unitPrice: 18500, gstRate: 0 }], total: 18500, status: "Paid" },
    { id: "i-2", invoiceNumber: "INV-1041", customerName: "Mehta Stores", date: dateOffset(-2), dueDate: dateOffset(12), subtotal: 8250, taxAmount: 0, taxMode: "IGST", lineItems: [{ description: "Business services", quantity: 1, unitPrice: 8250, gstRate: 0 }], total: 8250, status: "Pending" },
    { id: "i-3", invoiceNumber: "INV-1040", customerName: "Priya Kitchen", date: dateOffset(-4), dueDate: dateOffset(10), subtotal: 12800, taxAmount: 0, taxMode: "IGST", lineItems: [{ description: "Business services", quantity: 1, unitPrice: 12800, gstRate: 0 }], total: 12800, status: "Paid" },
  ],
  payments: [
    { id: "pay-1", customerName: "Rahul Enterprises", invoiceNumber: "INV-1042", amount: 18500, method: "UPI", status: "Completed", date: dateOffset(-1) },
    { id: "pay-2", customerName: "Priya Kitchen", invoiceNumber: "INV-1040", amount: 12800, method: "Cash", status: "Completed", date: dateOffset(-4) },
  ],
};

export function readCollection(collection) {
  try {
    const stored = localStorage.getItem(`mybillbuddy:${collection}`);
    if (stored) return JSON.parse(stored);
  } catch {
    // Start with sample data if browser storage is unavailable or invalid.
  }
  return (seeds[collection] || []).map((item) => ({ ...item }));
}

export function saveCollection(collection, records) {
  try {
    localStorage.setItem(`mybillbuddy:${collection}`, JSON.stringify(records));
    publishCollection(collection, records);
  } catch {
    publishCollection(collection, records);
  }
}

function publishCollection(collection, records) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { collection, records } }));
}

export async function saveServerRecord(collection, id, record) {
  const response = id
    ? await api.put(`/${collection}/${id}`, record)
    : await api.post(`/${collection}`, record);
  return response.data;
}

export async function deleteServerRecord(collection, id) {
  await api.delete(`/${collection}/${id}`);
}

export async function loadServerCollection(collection) {
  const response = await api.get(`/${collection}`);
  return Array.isArray(response.data) ? response.data : [];
}

export function useLocalCollection(collection) {
  const [mode] = React.useState(() => localStorage.getItem("mybillbuddy:session") ? "server" : "demo");
  const [records, setRecords] = React.useState(() => mode === "server" ? [] : readCollection(collection));
  const [loading, setLoading] = React.useState(mode === "server");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    if (mode === "server") {
      api.get(`/${collection}`)
        .then((response) => {
          if (active) setRecords(Array.isArray(response.data) ? response.data : []);
        })
        .catch((requestError) => {
          if (active) {
            setRecords([]);
            setError(requestError.response?.data?.message || "Could not load your server data. Check the API connection.");
          }
        })
        .finally(() => { if (active) setLoading(false); });
    }
    const refresh = (event) => {
      if (!event.detail || event.detail.collection === collection) {
        setRecords(event.detail?.records || readCollection(collection));
      }
    };
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.removeEventListener(eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [collection, mode]);

  const update = (next) => {
    saveCollection(collection, next);
    setRecords(next);
  };

  const replace = (next) => {
    setRecords(next);
    publishCollection(collection, next);
    setError("");
  };

  return [records, update, mode, error, replace, loading];
}

export function money(value, currency) {
  let selectedCurrency = currency;
  if (!selectedCurrency) {
    try { selectedCurrency = readWorkspaceSettings().currency; } catch { /* Default to INR when settings are unavailable. */ }
  }
  const currencyCode = String(selectedCurrency || "INR").toUpperCase().slice(0, 3);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: ["INR", "USD", "EUR"].includes(currencyCode) ? currencyCode : "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function amountPaid(invoice, payments) {
  return payments.filter((payment) => payment.invoiceNumber === invoice.invoiceNumber && payment.status === "Completed").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export function invoiceBalance(invoice, payments) {
  return Math.max(0, Number(invoice.total || 0) - amountPaid(invoice, payments));
}

export function invoiceStatus(invoice, payments) {
  if (invoiceBalance(invoice, payments) <= 0) return "Paid";
  if (invoice.dueDate && invoice.dueDate < today()) return "Overdue";
  return "Pending";
}

export function today() {
  return dateOffset(0);
}

export function exportCsv(filename, rows, columns) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.map((column) => escape(column.label)).join(","), ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
