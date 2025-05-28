"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// POST /api/auth/register - Регистрация пользователя
router.post('/register', auth_controller_1.register);
// POST /api/auth/login - Аутентификация пользователя
router.post('/login', auth_controller_1.login);
// GET /api/auth/me - Получение текущего пользователя
router.get('/me', auth_1.auth, auth_controller_1.getCurrentUser);
