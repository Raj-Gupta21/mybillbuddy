import api from "./api";

export const getInvoices = () => {
  return api.get("/invoices");
};

export const getInvoice = (id) => {
  return api.get(`/invoices/${id}`);
};

export const createInvoice = (data) => {
  return api.post("/invoices", data);
};

export const updateInvoice = (id, data) => {
  return api.put(`/invoices/${id}`, data);
};

export const deleteInvoice = (id) => {
  return api.delete(`/invoices/${id}`);
};

export const sendInvoice = (id) => {
  return api.post(`/invoices/${id}/send`);
};

export const downloadInvoicePDF = (id) => {
  return api.get(`/invoices/${id}/pdf`, {
    responseType: "blob",
  });
};