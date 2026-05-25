import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(async config => {
  if (config.url?.includes("/auth/")) return config;

  try {
    const token = document.cookie
      .split("; ")
      .find(row => row.startsWith("accessToken="))
      ?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Failed to read access token from cookie");
  }

  return config;
});

// Response Interceptor
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
          .find(row => row.startsWith("refreshToken="))
          ?.split("=")[1];

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/refresh-token`,
          { refresh_token: refreshToken },
          { withCredentials: true },
        );

        const newAccessToken = data.accessToken || data.access_token;
        const newRefreshToken = data.refreshToken || data.refresh_token;

        if (!newAccessToken) throw new Error("No new access token received");

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
