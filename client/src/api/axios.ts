import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7222/api', // замени порт на свой, если отличается
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;