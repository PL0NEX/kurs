import axios from 'axios';

console.log('API config initializing...');

// Проверяем текущий режим работы и URL сервера
const API_URL = 'http://localhost:3000/api';
console.log('Using API base URL:', API_URL);

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаем отправку куки и аутентификационных данных
});

console.log('Axios instance created with config:', {
  baseURL: API_URL,
  withCredentials: true
});

// Перехватчик запросов для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url, 'with method:', config.method);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    }
    
    // Для отладки
    console.log('Full request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request error interceptor:', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log('Received response from:', response.config.url, 'status:', response.status);
    return response;
  },
  (error) => {
    // Добавляем логирование для отладки
    console.error('API Error:', error);
    
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
    } else if (error.request) {
      console.log('Error request:', error.request);
    } else {
      console.log('Error message:', error.message);
    }
    
    // Если ошибка связана с истекшим токеном или авторизацией
    if (error.response && error.response.status === 401) {
      // Удаляем токен и перенаправляем на страницу входа
      localStorage.removeItem('token');
      
      // Если мы не на странице входа, перенаправляем
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 