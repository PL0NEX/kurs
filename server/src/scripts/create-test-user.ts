import 'dotenv/config';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

async function createTestUser() {
  try {
    // Инициализация подключения к базе данных
    await AppDataSource.initialize();
    console.log('База данных подключена');

    const userRepository = AppDataSource.getRepository(User);

    // Проверка существования пользователя
    const existingUser = await userRepository.findOne({ where: { email: 'test@example.com' } });
    if (existingUser) {
      console.log('Тестовый пользователь уже существует');
      await AppDataSource.destroy();
      return;
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Создание нового пользователя
    const user = userRepository.create({
      name: 'Тестовый Пользователь',
      email: 'test@example.com',
      password: hashedPassword
    });

    await userRepository.save(user);
    console.log('Тестовый пользователь успешно создан');

    // Закрытие соединения
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
  }
}

// Запуск функции
createTestUser(); 