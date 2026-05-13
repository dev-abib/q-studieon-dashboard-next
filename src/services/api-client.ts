import axios from "axios";
import { logoutAction } from "@/actions/auth-actions";

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

// Request Interceptor - No need to attach token manually
api.interceptors.request.use(config => {
  if (config.url?.includes("/auth/")) return config;
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
        // Backend will read refreshToken from cookie automatically
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/refresh-token`,
          {}, 
          { withCredentials: true },
        );

        processQueue(null);
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
