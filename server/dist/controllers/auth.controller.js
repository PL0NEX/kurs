"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const User_1 = require("../models/User");
// Регистрация нового пользователя
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Проверка наличия обязательных полей
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать имя, email и пароль'
            });
        }
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        // Проверка, существует ли пользователь с таким email
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }
        // Хеширование пароля
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Создание нового пользователя
        const user = userRepository.create({
            name,
            email,
            password: hashedPassword
        });
        await userRepository.save(user);
        // Создание JWT токена
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        // Отправка ответа без пароля
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при регистрации'
        });
    }
};
exports.register = register;
// Вход пользователя в систему
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Проверка наличия обязательных полей
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать email и пароль'
            });
        }
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        // Поиск пользователя по email
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }
        // Проверка пароля
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }
        // Создание JWT токена
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        // Отправка ответа без пароля
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе'
        });
    }
};
exports.login = login;
// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
    try {
        // req.user доступен из middleware auth
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        // Отправка ответа без пароля
        const { password, ...userWithoutPassword } = req.user;
        res.json({
            success: true,
            data: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении данных пользователя'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
