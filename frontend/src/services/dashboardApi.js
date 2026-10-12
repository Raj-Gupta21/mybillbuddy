import api from "./api";

export const getDashboardSummary = () => {
  return api.get("/dashboard/summary");
};

export const getSalesData = (period = "7days") => {
  return api.get(`/dashboard/sales?period=${period}`);
};

export const getRecentTransactions = () => {
  return api.get("/dashboard/recent-transactions");
};