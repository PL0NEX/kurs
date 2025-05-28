"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const data_source_1 = require("../config/data-source");
const User_1 = require("../models/User");
// Получение списка пользователей
const getUsers = async (req, res) => {
    try {
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        // В реальном приложении здесь будет пагинация и фильтрация
        const users = await userRepository.find({
            select: ['id', 'name', 'email', 'avatar', 'createdAt']
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении списка пользователей'
        });
    }
};
exports.getUsers = getUsers;
// Получение пользователя по ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id },
            select: ['id', 'name', 'email', 'avatar', 'createdAt']
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении пользователя'
        });
    }
};
exports.getUserById = getUserById;
// Обновление пользователя
const updateUser = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { name, email, password, avatar } = req.body;
        // Проверка, что текущий пользователь обновляет только свой профиль
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== id) {
            return res.status(403).json({
                success: false,
                message: 'У вас нет прав на обновление этого пользователя'
            });
        }
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        let user = await userRepository.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }
        // Обновление данных пользователя
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (avatar)
            user.avatar = avatar;
        // Обновление пароля, если он предоставлен
        if (password) {
            const salt = await bcrypt_1.default.genSalt(10);
            user.password = await bcrypt_1.default.hash(password, salt);
        }
        await userRepository.save(user);
        // Отправка ответа без пароля
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при обновлении пользователя'
        });
    }
};
exports.updateUser = updateUser;
// Удаление пользователя
const deleteUser = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // Проверка, что текущий пользователь удаляет только свой профиль
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== id) {
            return res.status(403).json({
                success: false,
                message: 'У вас нет прав на удаление этого пользователя'
            });
        }
        const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }
        await userRepository.remove(user);
        res.json({
            success: true,
            message: 'Пользователь успешно удален'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при удалении пользователя'
        });
    }
};
exports.deleteUser = deleteUser;
