"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.userRoutes = router;
// Все маршруты защищены middleware auth
router.use(auth_1.auth);
// GET /api/users - Получение списка пользователей
router.get('/', user_controller_1.getUsers);
// GET /api/users/:id - Получение пользователя по ID
router.get('/:id', user_controller_1.getUserById);
// PUT /api/users/:id - Обновление пользователя
router.put('/:id', user_controller_1.updateUser);
// DELETE /api/users/:id - Удаление пользователя
router.delete('/:id', user_controller_1.deleteUser);
