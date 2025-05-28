import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

// Регистрация нового пользователя
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Проверка наличия обязательных полей
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать имя, email и пароль'
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Проверка, существует ли пользователь с таким email
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание нового пользователя
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword
    });

    await userRepository.save(user);

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

    // Отправка ответа без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
};

// Вход пользователя в систему
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Проверка наличия обязательных полей
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать email и пароль'
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Поиск пользователя по email
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

    // Отправка ответа без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.user доступен из middleware auth
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    // Отправка ответа без пароля
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении данных пользователя'
    });
  }
}; 