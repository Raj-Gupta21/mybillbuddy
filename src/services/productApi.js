import api from "./api";

export const getProducts = () => {
  return api.get("/products");
};

export const getProduct = (id) => {
  return api.get(`/products/${id}`);
};

export const createProduct = (data) => {
  return api.post("/products", data);
};

export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};

export const updateStock = (id, data) => {
  return api.patch(`/products/${id}/stock`, data);
};