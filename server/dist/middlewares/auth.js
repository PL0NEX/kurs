"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const data_source_1 = require("../config/data-source");
const auth = async (req, res, next) => {
    try {
        // Получение токена из заголовка
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Токен не предоставлен' });
        }
        const token = authHeader.split(' ')[1];
        // Проверка токена
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        // Поиск пользователя
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({ where: { id: decoded.id } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Пользователь не найден' });
        }
        // Добавление пользователя в запрос
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Неверный токен' });
    }
};
exports.auth = auth;
