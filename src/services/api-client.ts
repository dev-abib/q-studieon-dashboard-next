// src/lib/api.ts
import axios from "axios";
import { saveTokensAction, logoutAction } from "@/actions/auth-actions";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(config => {
  if (config.url?.includes("/auth/")) return config;

  // For now, we rely on withCredentials + httpOnly cookies
  // Backend should accept cookies
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = document.cookie
          .split("; ")
          .find(row => row.startsWith(`${REFRESH_COOKIE}=`))
          ?.split("=")[1];

        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/refresh-token`,
          { refreshToken: refreshToken },
          { withCredentials: true },
        );

        const newAccess = data.accessToken;
        const newRefresh = data.refreshToken || data.refresh_token;

        await saveTokensAction(newAccess, newRefresh);

        processQueue(null);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        await logoutAction();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
