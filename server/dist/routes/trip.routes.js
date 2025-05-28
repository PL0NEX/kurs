"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripRoutes = void 0;
const express_1 = require("express");
const trip_controller_1 = require("../controllers/trip.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.tripRoutes = router;
// Все маршруты защищены middleware auth
router.use(auth_1.auth);
// GET /api/trips - Получение списка путешествий
router.get('/', trip_controller_1.getTrips);
// POST /api/trips - Создание нового путешествия
router.post('/', trip_controller_1.createTrip);
// GET /api/trips/:id - Получение путешествия по ID
router.get('/:id', trip_controller_1.getTripById);
// PUT /api/trips/:id - Обновление путешествия
router.put('/:id', trip_controller_1.updateTrip);
// DELETE /api/trips/:id - Удаление путешествия
router.delete('/:id', trip_controller_1.deleteTrip);
// GET /api/trips/:id/participants - Получение участников путешествия
router.get('/:id/participants', trip_controller_1.getParticipants);
// POST /api/trips/:id/participants - Добавление участника
router.post('/:id/participants', trip_controller_1.addParticipant);
// DELETE /api/trips/:id/participants/:participantId - Удаление участника
router.delete('/:id/participants/:participantId', trip_controller_1.removeParticipant);
// GET /api/trips/:id/points - Получение точек маршрута
router.get('/:id/points', trip_controller_1.getPoints);
// POST /api/trips/:id/points - Добавление точки маршрута
router.post('/:id/points', trip_controller_1.addPoint);
// PUT /api/trips/:id/points/:pointId - Обновление точки маршрута
router.put('/:id/points/:pointId', trip_controller_1.updatePoint);
// DELETE /api/trips/:id/points/:pointId - Удаление точки маршрута
router.delete('/:id/points/:pointId', trip_controller_1.deletePoint);
// POST /api/trips/:id/points/:pointId/vote - Голосование за точку маршрута
router.post('/:id/points/:pointId/vote', trip_controller_1.voteForPoint);
// GET /api/trips/:id/expenses - Получение расходов
router.get('/:id/expenses', trip_controller_1.getExpenses);
// POST /api/trips/:id/expenses - Добавление расхода
router.post('/:id/expenses', trip_controller_1.addExpense);
// PUT /api/trips/:id/expenses/:expenseId - Обновление расхода
router.put('/:id/expenses/:expenseId', trip_controller_1.updateExpense);
// DELETE /api/trips/:id/expenses/:expenseId - Удаление расхода
router.delete('/:id/expenses/:expenseId', trip_controller_1.deleteExpense);
