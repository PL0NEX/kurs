import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

// Получение списка пользователей
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // В реальном приложении здесь будет пагинация и фильтрация
    const users = await userRepository.find({
      select: ['id', 'name', 'email', 'avatar', 'createdAt']
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении списка пользователей'
    });
  }
};

// Получение пользователя по ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'name', 'email', 'avatar', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении пользователя'
    });
  }
};

// Обновление пользователя
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, avatar } = req.body;
    
    // Проверка, что текущий пользователь обновляет только свой профиль
    if (req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на обновление этого пользователя'
      });
    }
    
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Обновление данных пользователя
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    
    // Обновление пароля, если он предоставлен
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await userRepository.save(user);
    
    // Отправка ответа без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении пользователя'
    });
  }
};

// Удаление пользователя
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Проверка, что текущий пользователь удаляет только свой профиль
    if (req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на удаление этого пользователя'
      });
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    await userRepository.remove(user);
    
    res.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении пользователя'
    });
  }
};
