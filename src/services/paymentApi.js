import api from "./api";

export const getPayments = () => {
  return api.get("/payments");
};

export const getPayment = (id) => {
  return api.get(`/payments/${id}`);
};

export const createPayment = (data) => {
  return api.post("/payments", data);
};

export const updatePayment = (id, data) => {
  return api.put(`/payments/${id}`, data);
};

export const deletePayment = (id) => {
  return api.delete(`/payments/${id}`);
};