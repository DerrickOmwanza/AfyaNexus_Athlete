import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("afyanexus_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear storage and redirect to login — but NOT for password change endpoint
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url ?? "";
    if (err.response?.status === 401 && typeof window !== "undefined" && !url.includes("/auth/password")) {
      localStorage.removeItem("afyanexus_token");
      localStorage.removeItem("afyanexus_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
