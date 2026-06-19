import axios from 'axios';
import {
  clearAuth,
  decodeUserFromToken,
  getAccessToken,
  getRefreshToken,
  setTokens,
  setUser,
} from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/refresh`,
            { refreshToken },
          );
          setTokens(data.accessToken, data.refreshToken);
          const user = decodeUserFromToken(data.accessToken);
          if (user) setUser(user);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          clearAuth();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
