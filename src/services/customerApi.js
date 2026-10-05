import api from "./api";

export const getCustomers = () => {
  return api.get("/customers");
};

export const getCustomer = (id) => {
  return api.get(`/customers/${id}`);
};

export const createCustomer = (data) => {
  return api.post("/customers", data);
};

export const updateCustomer = (id, data) => {
  return api.put(`/customers/${id}`, data);
};

export const deleteCustomer = (id) => {
  return api.delete(`/customers/${id}`);
};