import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';

// Расширение типа Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Логирование для отладки
    console.log('Auth middleware запущен');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Получение токена из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Токен не найден в заголовке', { authHeader });
      return res.status(401).json({ success: false, message: 'Токен не предоставлен' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Токен получен:', token.substring(0, 10) + '...');
    
    // Проверка токена
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    console.log('Используемый JWT_SECRET:', jwtSecret.substring(0, 5) + '...');
    
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    console.log('Токен декодирован, ID пользователя:', decoded.id);
    
    // Поиск пользователя
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      console.log('Пользователь не найден:', decoded.id);
      return res.status(401).json({ success: false, message: 'Пользователь не найден' });
    }
    
    console.log('Пользователь найден:', user.email);
    
    // Добавление пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Неверный токен' });
  }
}; 