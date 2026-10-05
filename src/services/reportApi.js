import api from "./api";

export const getSalesReport = () => {
  return api.get("/reports/sales");
};

export const getPaymentReport = () => {
  return api.get("/reports/payments");
};

export const getInvoiceReport = () => {
  return api.get("/reports/invoices");
};

export const getInventoryReport = () => {
  return api.get("/reports/inventory");
};