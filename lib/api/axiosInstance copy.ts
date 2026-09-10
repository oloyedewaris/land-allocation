import axios from "axios";
import { BaseURL } from "../constants/auth-keys";
import { store_name } from "../constants/store-name";

// --- Global axios defaults ---
axios.defaults.withCredentials = true;

// --- Unauthenticated instance (used for refresh calls) ---
export const userAxios = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 1000 * 60 * 5, // 5 min safety timeout
});

// export const axiosInstance = axios.create({
//   baseURL: BaseURL,
//   headers: { "Content-Type": "application/json" },
//   timeout: 30 * 60 * 1000,
// });

// axiosInstance.interceptors.request.use(
//   async (config) => {
//     const token = sessionStorage.getItem("token");
//     const storeName = store_name();
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     if (storeName) config.headers["store-name"] = storeName;
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// --- Authenticated instance ---
export const adminAxios = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 1000 * 60 * 5,
});

// --- Refresh token state ---
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

/* =========================================================
   ⏳ Token auto-refresh timer
========================================================= */
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleTokenRefresh = (expiresAt: string) => {
  if (refreshTimeout) clearTimeout(refreshTimeout);

  const expirationMs = new Date(expiresAt).getTime();
  const now = Date.now();

  const refreshAtMs = expirationMs - 60_000; // refresh 1 minute early
  const delay = refreshAtMs - now;

  if (delay > 0) {
    refreshTimeout = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.error("Auto refresh failed:", err);
      }
    }, delay);
  }
};

/* ========================================================= */

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await userAxios.post("/auth/refresh");
    const newAccessToken = res.data?.data?.access_token;
    const expire = res.data?.data?.expires_at;

    if (newAccessToken) {
      // Save in session/local storage
      sessionStorage.setItem("token", newAccessToken);

      // 🆕 schedule refresh 1 minute before expiry
      if (expire) scheduleTokenRefresh(expire);

      return newAccessToken;
    }
    return null;
  } catch (err: any) {
    const status = err?.response?.status;

    // ❗ Only logout if refresh token truly expired
    if (status === 401 || status === 403 || status === 503) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("token");
        window.location.reload();
      }
    }
    return null;
  }
};

// --- Handle 401s gracefully ---
const handle401Error = async (error: any, originalRequest: any) => {
  if (originalRequest._retry) return Promise.reject(error);
  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return adminAxios(originalRequest);
      })
      .catch((err) => Promise.reject(err));
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);
    if (!newToken) throw new Error("No new token");

    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
    return adminAxios(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

// --- Interceptors for adminAxios ---
adminAxios.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("token");
    const storeName = store_name();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (storeName) config.headers["store-name"] = storeName;
    return config;
  },
  (error) => Promise.reject(error),
);

adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(error);

    const { status } = error.response;
    const originalRequest = error.config;

    // Safari: sometimes returns 0 status when waking from background
    if (status === 0 && !navigator.onLine) {
      // wait a bit and retry once
      await new Promise((res) => setTimeout(res, 1000));
      return adminAxios(originalRequest);
    }

    if (status === 401) {
      return handle401Error(error, originalRequest);
    }

    return Promise.reject(error);
  },
);

// --- Interceptors for userAxios ---
userAxios.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("token");
    const storeName = store_name();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (storeName) config.headers["store-name"] = storeName;
    return config;
  },
  (error) => Promise.reject(error),
);

export default userAxios;
