import axios, { type AxiosError } from 'axios';

export const TOKEN_KEY = 'auth_token';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (
      data.code === 'SUCCESS' ||
      data.code === 0 ||
      data.code === 200 ||
      data.code === 201
    ) {
      return data.data;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const responseData = error.response?.data;
    // 处理验证错误，提取字段级错误信息
    if (error.response?.status === 422 && responseData?.error?.fieldErrors) {
      const fieldErrors = responseData.error.fieldErrors;
      const messages = Object.values(fieldErrors).flat().join('；');
      const err = new Error(
        messages || responseData.error.message || '验证失败',
      );
      (
        err as AxiosError & { fieldErrors?: Record<string, string[]> }
      ).fieldErrors = fieldErrors;
      return Promise.reject(err);
    }
    const message =
      responseData?.error?.message ||
      responseData?.message ||
      error.message ||
      '网络错误';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
