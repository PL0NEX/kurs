import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { auth } from '../middlewares/auth';

const router = Router();

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', register);

// POST /api/auth/login - Аутентификация пользователя
router.post('/login', login);

// GET /api/auth/me - Получение данных текущего пользователя
router.get('/me', auth, getCurrentUser);

export { router as authRoutes }; 