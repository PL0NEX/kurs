import 'dotenv/config';
import { AppDataSource } from './config/data-source';
import app from './app';

const PORT = process.env.PORT || 3000;

// Инициализация подключения к базе данных
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
    startServer();
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

// Запуск сервера
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};
