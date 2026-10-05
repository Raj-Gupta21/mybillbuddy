import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const method = String(config.method || "get").toUpperCase();
    const publicAuth = ["/auth/login", "/auth/register"].some((path) => String(config.url || "").startsWith(path));
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && !publicAuth) {
      let csrfToken = sessionStorage.getItem("mybillbuddy:csrf");
      if (!csrfToken) {
        const response = await api.get("/auth/csrf");
        csrfToken = response.data?.csrfToken;
        if (csrfToken) sessionStorage.setItem("mybillbuddy:csrf", csrfToken);
      }
      if (csrfToken) config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("mybillbuddy:session")) {
      localStorage.removeItem("mybillbuddy:session");
      sessionStorage.removeItem("mybillbuddy:csrf");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
