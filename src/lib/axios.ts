import { logoutAction, saveTokensAction } from "@/actions/auth-actions";
import { api } from "@/services/api-client";
import axios from "axios";


api.interceptors.request.use(async config => {
  const token = document.cookie
    .split("; ")
    .find(row => row.startsWith("access_token="))
    ?.split("=")[1];

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = document.cookie
          .split("; ")
          .find(row => row.startsWith("refresh_token="))
          ?.split("=")[1];

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/refresh-token`,
          { refresh_token: refreshToken },
        );

        // save new tokens to cookies via server action
        await saveTokensAction(data.accessToken, data.refreshToken);

        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
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
