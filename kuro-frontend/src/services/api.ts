import axios from "axios";
import { logout } from "../store/userStore";

type ProcessEnv = Record<string, string | undefined>;

function getServerEnv(): ProcessEnv | undefined {
  const g = globalThis as unknown as { process?: { env?: ProcessEnv } };
  return g.process?.env;
}

function getBaseUrl() {
  if (typeof window === "undefined") {
    const env = getServerEnv();
    return env?.API_URL_INTERNAL || env?.PUBLIC_API_URL || "http://backend:8000/api";
  }
  return import.meta.env.PUBLIC_API_URL || "http://127.0.0.1:8000/api";
}

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Solicitud
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de Respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/login/") ||
      originalRequest?.url?.includes("/register/") ||
      originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        const res = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        if (res.status === 200) {
          const newAccessToken = res.data.access;
          localStorage.setItem("access_token", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token de refresco expirado o inválido");
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
