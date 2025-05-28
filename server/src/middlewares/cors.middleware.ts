import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для настройки CORS
 * Разрешает кросс-доменные запросы с frontend клиента
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Получаем origin из запроса
  const origin = req.headers.origin;
  
  // Разрешаем доступ с локальных клиентских приложений
  const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002'];
  
  // Устанавливаем правильный заголовок Access-Control-Allow-Origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // Разрешаем определенные заголовки
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Разрешаем определенные методы
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Разрешаем отправку куки и аутентификационных данных
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Для preflight запросов (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}; 