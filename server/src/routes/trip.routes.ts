import { Router } from 'express';
import { 
  getTrips, 
  createTrip, 
  getTripById, 
  updateTrip, 
  deleteTrip, 
  addParticipant, 
  removeParticipant, 
  addPoint, 
  getPoints, 
  updatePoint, 
  deletePoint, 
  getParticipants,
  getExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense
} from '../controllers/trip.controller';
import { auth } from '../middlewares/auth';

const router = Router();

// GET /api/trips - Получение списка путешествий пользователя
router.get('/', auth, getTrips);

// POST /api/trips - Создание нового путешествия
router.post('/', auth, createTrip);

// GET /api/trips/:id - Получение информации о путешествии
router.get('/:id', auth, getTripById);

// PUT /api/trips/:id - Обновление данных путешествия
router.put('/:id', auth, updateTrip);

// DELETE /api/trips/:id - Удаление путешествия
router.delete('/:id', auth, deleteTrip);

// GET /api/trips/:id/participants - Получение участников путешествия
router.get('/:id/participants', auth, getParticipants);

// POST /api/trips/:id/participants - Добавление участника в путешествие
router.post('/:id/participants', auth, addParticipant);

// DELETE /api/trips/:id/participants/:userId - Удаление участника из путешествия
router.delete('/:id/participants/:userId', auth, removeParticipant);

// GET /api/trips/:id/points - Получение точек маршрута
router.get('/:id/points', auth, getPoints);

// POST /api/trips/:id/points - Добавление точки маршрута
router.post('/:id/points', auth, addPoint);

// PUT /api/trips/:id/points/:pointId - Обновление точки маршрута
router.put('/:id/points/:pointId', auth, updatePoint);

// DELETE /api/trips/:id/points/:pointId - Удаление точки маршрута
router.delete('/:id/points/:pointId', auth, deletePoint);

// Маршруты для работы с расходами
// GET /api/trips/:id/expenses - Получение расходов путешествия
router.get('/:id/expenses', auth, getExpenses);

// GET /api/trips/:id/expenses/:expenseId - Получение конкретного расхода
router.get('/:id/expenses/:expenseId', auth, getExpenseById);

// POST /api/trips/:id/expenses - Добавление расхода
router.post('/:id/expenses', auth, addExpense);

// PUT /api/trips/:id/expenses/:expenseId - Обновление расхода
router.put('/:id/expenses/:expenseId', auth, updateExpense);

// DELETE /api/trips/:id/expenses/:expenseId - Удаление расхода
router.delete('/:id/expenses/:expenseId', auth, deleteExpense);

// Комментируем маршруты, которые еще не реализованы
/*
// POST /api/trips/:id/voting/start - Начало голосования
router.post('/:id/voting/start', auth, startVoting);

// POST /api/trips/:tripId/points/:pointId/vote - Голосование за точку
router.post('/:tripId/points/:pointId/vote', auth, voteForPoint);

// GET /api/trips/:tripId/voting/results - Получение результатов голосования
router.get('/:tripId/voting/results', auth, getVotingResults);
*/

export { router as tripRoutes }; 