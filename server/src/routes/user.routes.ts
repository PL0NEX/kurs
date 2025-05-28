import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { auth } from '../middlewares/auth';

const router = Router();

// Все маршруты защищены middleware auth
router.use(auth);

// GET /api/users - Получение списка пользователей
router.get('/', getUsers);

// GET /api/users/:id - Получение пользователя по ID
router.get('/:id', getUserById);

// PUT /api/users/:id - Обновление пользователя
router.put('/:id', updateUser);

// DELETE /api/users/:id - Удаление пользователя
router.delete('/:id', deleteUser);

export { router as userRoutes };
