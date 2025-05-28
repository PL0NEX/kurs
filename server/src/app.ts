import express from 'express';
import { json } from 'body-parser';
import path from 'path';
import 'dotenv/config';

// Routes
import { authRoutes } from './routes/auth.routes';
import { tripRoutes } from './routes/trip.routes';
import { userRoutes } from './routes/user.routes';

// Middlewares
import { corsMiddleware } from './middlewares/cors.middleware';
import { auth as authMiddleware } from './middlewares/auth';

const app = express();

// Body parser
app.use(json());

// CORS middleware
app.use(corsMiddleware);

// Публичная папка для статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты, не требующие аутентификации
app.use('/api/auth', authRoutes);

// Проверка здоровья API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Защищенные маршруты с аутентификацией
app.use('/api/trips', authMiddleware, tripRoutes);
app.use('/api/users', authMiddleware, userRoutes);

export default app; 