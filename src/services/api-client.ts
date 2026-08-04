import axios, { InternalAxiosRequestConfig } from "axios";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error?: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config as RetryAxiosRequestConfig;
    const url = originalRequest?.url || "";
    const isAuthRoute = url.includes("/login") || url.includes("/logout");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/refresh-token`,
          {},
          { withCredentials: true },
        );

        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear stale httpOnly cookies server-side so the middleware sends the
        // user to /login instead of bouncing back to /dashboard.
        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/clear-session`,
            {},
            { withCredentials: true, timeout: 5000 },
          );
        } catch {
          // ignore — the login flow overwrites cookies anyway
        }
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
