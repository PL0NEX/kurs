"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteForPoint = exports.deleteExpense = exports.updateExpense = exports.addExpense = exports.getExpenses = exports.deletePoint = exports.updatePoint = exports.addPoint = exports.getPoints = exports.removeParticipant = exports.addParticipant = exports.getParticipants = exports.deleteTrip = exports.updateTrip = exports.createTrip = exports.getTripById = exports.getTrips = void 0;
const data_source_1 = require("../config/data-source");
const Trip_1 = require("../models/Trip");
const Participant_1 = require("../models/Participant");
// Получение списка путешествий пользователя
const getTrips = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        const tripRepository = data_source_1.AppDataSource.getRepository(Trip_1.Trip);
        const participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        // Поиск путешествий, где пользователь является владельцем
        const ownedTrips = await tripRepository.find({
            where: { ownerId: userId },
            relations: ['participants', 'participants.user']
        });
        // Поиск путешествий, где пользователь является участником
        const participations = await participantRepository.find({
            where: {
                userId,
                status: Participant_1.ParticipantStatus.ACCEPTED
            },
            relations: ['trip', 'trip.participants', 'trip.participants.user']
        });
        const participatedTrips = participations.map(p => p.trip);
        // Объединение результатов
        const allTrips = [...ownedTrips, ...participatedTrips];
        // Удаление дубликатов
        const uniqueTrips = allTrips.filter((trip, index, self) => index === self.findIndex(t => t.id === trip.id));
        res.json({
            success: true,
            data: uniqueTrips
        });
    }
    catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении списка путешествий'
        });
    }
};
exports.getTrips = getTrips;
// Получение путешествия по ID
const getTripById = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        const tripRepository = data_source_1.AppDataSource.getRepository(Trip_1.Trip);
        const participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        const trip = await tripRepository.findOne({
            where: { id },
            relations: ['points', 'participants', 'participants.user', 'expenses', 'expenses.paidBy', 'expenses.splitBetween']
        });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Путешествие не найдено'
            });
        }
        // Проверка прав доступа
        const isOwner = trip.ownerId === userId;
        const isParticipant = trip.participants.some(p => p.userId === userId && p.status === Participant_1.ParticipantStatus.ACCEPTED);
        if (!isOwner && !isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'У вас нет прав на просмотр этого путешествия'
            });
        }
        res.json({
            success: true,
            data: trip
        });
    }
    catch (error) {
        console.error('Get trip by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении путешествия'
        });
    }
};
exports.getTripById = getTripById;
// Создание нового путешествия
const createTrip = async (req, res) => {
    var _a;
    try {
        const { title, description, startDate, endDate, status = Trip_1.TripStatus.DRAFT, imageUrl } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        // Проверка обязательных полей
        if (!title || !description || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать название, описание, дату начала и дату окончания'
            });
        }
        const tripRepository = data_source_1.AppDataSource.getRepository(Trip_1.Trip);
        const participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        // Создание нового путешествия
        const trip = tripRepository.create({
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status,
            imageUrl,
            ownerId: userId
        });
        await tripRepository.save(trip);
        // Добавление создателя как участника
        const participant = participantRepository.create({
            tripId: trip.id,
            userId,
            role: Participant_1.ParticipantRole.OWNER,
            status: Participant_1.ParticipantStatus.ACCEPTED
        });
        await participantRepository.save(participant);
        res.status(201).json({
            success: true,
            data: trip
        });
    }
    catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при создании путешествия'
        });
    }
};
exports.createTrip = createTrip;
// Обновление путешествия
const updateTrip = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { title, description, startDate, endDate, status, imageUrl } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        const tripRepository = data_source_1.AppDataSource.getRepository(Trip_1.Trip);
        const participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        const trip = await tripRepository.findOne({ where: { id } });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Путешествие не найдено'
            });
        }
        // Проверка прав доступа (только владелец или редакторы могут обновлять)
        const participant = await participantRepository.findOne({
            where: {
                tripId: id,
                userId
            }
        });
        if (!participant || (participant.role !== Participant_1.ParticipantRole.OWNER && participant.role !== Participant_1.ParticipantRole.EDITOR)) {
            return res.status(403).json({
                success: false,
                message: 'У вас нет прав на редактирование этого путешествия'
            });
        }
        // Обновление полей
        if (title)
            trip.title = title;
        if (description)
            trip.description = description;
        if (startDate)
            trip.startDate = new Date(startDate);
        if (endDate)
            trip.endDate = new Date(endDate);
        if (status)
            trip.status = status;
        if (imageUrl !== undefined)
            trip.imageUrl = imageUrl;
        await tripRepository.save(trip);
        res.json({
            success: true,
            data: trip
        });
    }
    catch (error) {
        console.error('Update trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при обновлении путешествия'
        });
    }
};
exports.updateTrip = updateTrip;
// Удаление путешествия
const deleteTrip = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Не авторизован'
            });
        }
        const tripRepository = data_source_1.AppDataSource.getRepository(Trip_1.Trip);
        const trip = await tripRepository.findOne({
            where: { id },
            relations: ['participants']
        });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Путешествие не найдено'
            });
        }
        // Проверка прав доступа (только владелец может удалять)
        if (trip.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'У вас нет прав на удаление этого путешествия'
            });
        }
        await tripRepository.remove(trip);
        res.json({
            success: true,
            message: 'Путешествие успешно удалено'
        });
    }
    catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при удалении путешествия'
        });
    }
};
exports.deleteTrip = deleteTrip;
// Заглушки для остальных методов (будут реализованы позже)
const getParticipants = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: [] });
};
exports.getParticipants = getParticipants;
const addParticipant = async (req, res) => {
    // Заглушка
    res.status(201).json({ success: true, data: {} });
};
exports.addParticipant = addParticipant;
const removeParticipant = async (req, res) => {
    // Заглушка
    res.json({ success: true, message: 'Участник удален' });
};
exports.removeParticipant = removeParticipant;
const getPoints = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: [] });
};
exports.getPoints = getPoints;
const addPoint = async (req, res) => {
    // Заглушка
    res.status(201).json({ success: true, data: {} });
};
exports.addPoint = addPoint;
const updatePoint = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: {} });
};
exports.updatePoint = updatePoint;
const deletePoint = async (req, res) => {
    // Заглушка
    res.json({ success: true, message: 'Точка удалена' });
};
exports.deletePoint = deletePoint;
const getExpenses = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: [] });
};
exports.getExpenses = getExpenses;
const addExpense = async (req, res) => {
    // Заглушка
    res.status(201).json({ success: true, data: {} });
};
exports.addExpense = addExpense;
const updateExpense = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: {} });
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    // Заглушка
    res.json({ success: true, message: 'Расход удален' });
};
exports.deleteExpense = deleteExpense;
const voteForPoint = async (req, res) => {
    // Заглушка
    res.json({ success: true, data: {} });
};
exports.voteForPoint = voteForPoint;
