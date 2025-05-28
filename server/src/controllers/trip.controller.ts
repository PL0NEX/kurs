import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Trip, TripStatus } from '../models/Trip';
import { User } from '../models/User';
import { Point } from '../models/Point';
import { Participant, ParticipantRole, ParticipantStatus } from '../models/Participant';
import { Expense, ExpenseCategory } from '../models/Expense';
import { Vote } from '../models/Vote';
import { In } from 'typeorm';

// Получение списка путешествий пользователя
export const getTrips = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);

    // Поиск путешествий, где пользователь является владельцем
    const ownedTrips = await tripRepository.find({
      where: { ownerId: userId },
      relations: ['participants', 'participants.user', 'expenses']
    });

    // Поиск путешествий, где пользователь является участником
    const participations = await participantRepository.find({
      where: { 
        userId,
        status: ParticipantStatus.ACCEPTED
      },
      relations: ['trip', 'trip.participants', 'trip.participants.user', 'trip.expenses']
    });

    const participatedTrips = participations.map(p => p.trip);

    // Объединение результатов
    const allTrips = [...ownedTrips, ...participatedTrips];

    // Удаление дубликатов
    const uniqueTrips = allTrips.filter((trip, index, self) =>
      index === self.findIndex(t => t.id === trip.id)
    );

    // Преобразуем данные для ответа, добавляя бюджет из вычисляемого свойства
    const responseData = uniqueTrips.map(trip => {
      return {
        ...trip,
        budget: trip.totalBudget // Используем вычисляемое свойство
      };
    });

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении списка путешествий'
    });
  }
};

// Получение путешествия по ID
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);

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
    const isParticipant = trip.participants.some(p => 
      p.userId === userId && p.status === ParticipantStatus.ACCEPTED
    );

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
  } catch (error) {
    console.error('Get trip by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении путешествия'
    });
  }
};

// Создание нового путешествия
export const createTrip = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      status = TripStatus.DRAFT,
      imageUrl
    } = req.body;

    const userId = req.user?.id;
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

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);

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
      role: ParticipantRole.OWNER,
      status: ParticipantStatus.ACCEPTED
    });

    await participantRepository.save(participant);

    res.status(201).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании путешествия'
    });
  }
};

// Обновление путешествия
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      status,
      imageUrl
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);

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

    if (!participant || (participant.role !== ParticipantRole.OWNER && participant.role !== ParticipantRole.EDITOR)) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Обновление полей
    if (title) trip.title = title;
    if (description) trip.description = description;
    if (startDate) trip.startDate = new Date(startDate);
    if (endDate) trip.endDate = new Date(endDate);
    if (status) trip.status = status;
    if (imageUrl !== undefined) trip.imageUrl = imageUrl;

    await tripRepository.save(trip);

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении путешествия'
    });
  }
};

// Удаление путешествия
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
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
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении путешествия'
    });
  }
};

// Получение списка участников путешествия
export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id путешествия
    const userId = req.user?.id;

    console.log(`API: Запрос участников для путешествия ${id} от пользователя ${userId}`);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const userRepository = AppDataSource.getRepository(User);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      console.log(`API: Путешествие с ID ${id} не найдено`);
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем, что пользователь имеет доступ к путешествию
    const requestingParticipant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId
      }
    });

    if (!requestingParticipant) {
      console.log(`API: У пользователя ${userId} нет доступа к путешествию ${id}`);
      return res.status(403).json({
        success: false,
        message: 'У вас нет доступа к этому путешествию'
      });
    }

    // Получаем всех участников путешествия
    const participants = await participantRepository.find({
      where: { tripId: id },
      relations: ['user']
    });

    console.log(`API: Найдено ${participants.length} участников`);

    // Формируем список участников с нужной информацией
    const participantList = await Promise.all(participants.map(async (participant) => {
      // Для существующих пользователей берем данные из связанной сущности User
      if (participant.userId) {
        const user = participant.user || await userRepository.findOne({ 
          where: { id: participant.userId } 
        });

        const participantInfo = {
          id: participant.id,
          userId: participant.userId,
          name: user?.name || 'Неизвестный пользователь',
          email: user?.email,
          avatar: user?.avatar,
          role: participant.role,
          status: participant.status,
          isOwner: participant.role === ParticipantRole.OWNER
        };
        console.log(`API: Участник с userId ${participant.userId}:`, participantInfo);
        return participantInfo;
      } else {
        // Для приглашенных пользователей используем только email
        const participantInfo = {
          id: participant.id,
          email: participant.invitedEmail,
          name: participant.invitedEmail ? participant.invitedEmail.split('@')[0] : 'Приглашенный участник',
          role: participant.role,
          status: participant.status,
          isOwner: false
        };
        console.log(`API: Приглашенный участник:`, participantInfo);
        return participantInfo;
      }
    }));

    console.log(`API: Отправляем список участников:`, participantList);
    res.json({
      success: true,
      data: participantList
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении списка участников'
    });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id путешествия
    const { email } = req.body; // email нового участника
    const userId = req.user?.id;

    console.log(`API: Добавление участника с email ${email} в путешествие ${id} пользователем ${userId}`);
    console.log('Тело запроса:', req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    if (!email) {
      console.log('API: Email участника не указан');
      return res.status(400).json({
        success: false,
        message: 'Email участника не указан'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const userRepository = AppDataSource.getRepository(User);

    // Проверяем существование путешествия
    console.log(`API: Поиск путешествия с ID ${id}`);
    const trip = await tripRepository.findOne({ 
      where: { id }
    });

    if (!trip) {
      console.log(`API: Путешествие с ID ${id} не найдено`);
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем, что пользователь, добавляющий участника, имеет права доступа
    console.log(`API: Проверка прав пользователя ${userId} для путешествия ${id}`);
    const requestingParticipant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId
      }
    });

    console.log('API: Данные инициатора:', requestingParticipant);

    if (!requestingParticipant || requestingParticipant.role !== ParticipantRole.OWNER) {
      console.log(`API: У пользователя ${userId} нет прав на добавление участников в путешествие ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Только владелец путешествия может добавлять участников'
      });
    }

    // Проверяем, не существует ли уже такой участник
    console.log(`API: Проверка существования участника с email ${email}`);
    
    const existingParticipantByEmail = await participantRepository.findOne({
      where: { 
        tripId: id, 
        invitedEmail: email 
      }
    });

    console.log('API: Найденный участник по email:', existingParticipantByEmail);

    const existingUser = await userRepository.findOne({
      where: { email }
    });

    console.log('API: Найденный пользователь по email:', existingUser);

    let existingParticipantByUser = null;
    if (existingUser) {
      existingParticipantByUser = await participantRepository.findOne({
        where: { 
          tripId: id, 
          userId: existingUser.id 
        }
      });
      console.log('API: Найденный участник по пользователю:', existingParticipantByUser);
    }

    if (existingParticipantByEmail || existingParticipantByUser) {
      console.log(`API: Участник с email ${email} уже добавлен в путешествие ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Участник с таким email уже добавлен в путешествие'
      });
    }

    try {
      // Создаем объект нового участника
      let newParticipant;

      if (existingUser) {
        console.log(`API: Пользователь с email ${email} существует, ID: ${existingUser.id}`);
        // Пользователь существует, добавляем его в путешествие
        newParticipant = participantRepository.create({
          tripId: id,
          userId: existingUser.id,
          role: ParticipantRole.VIEWER,
          status: ParticipantStatus.PENDING
        });
        console.log('API: Создан объект участника для существующего пользователя:', newParticipant);
      } else {
        console.log(`API: Пользователь с email ${email} не существует, создаем приглашение`);
        // Пользователь не существует, создаем приглашение по email
        newParticipant = participantRepository.create({
          tripId: id,
          role: ParticipantRole.VIEWER,
          status: ParticipantStatus.PENDING,
          invitedEmail: email,
          // userId должен быть null (undefined) для приглашений по email
          userId: undefined
        });
        console.log('API: Создан объект участника с приглашением:', newParticipant);
      }

      console.log('API: Сохранение нового участника...');
      const savedParticipant = await participantRepository.save(newParticipant);
      console.log(`API: Участник сохранен, ID: ${savedParticipant.id}`);

      // В реальном приложении здесь также может быть отправка email-приглашения

      const responseData = {
        id: savedParticipant.id,
        email,
        name: existingUser?.name || email.split('@')[0],
        role: savedParticipant.role,
        status: savedParticipant.status,
        isOwner: false
      };

      console.log(`API: Отправляем ответ:`, responseData);
      res.status(201).json({
        success: true,
        message: 'Участник успешно добавлен',
        data: responseData
      });
    } catch (dbError) {
      console.error('Ошибка при сохранении участника в БД:', dbError);
      if (dbError instanceof Error) {
        console.error('Детали ошибки БД:', {
          message: dbError.message,
          stack: dbError.stack
        });
      }
      throw dbError; // Пробрасываем ошибку наверх для общей обработки
    }
  } catch (error) {
    console.error('Add participant error:', error);
    
    // Детальное логирование ошибки
    if (error instanceof Error) {
      console.error('Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Если это ошибка базы данных, логируем более подробную информацию
      if ('code' in error && 'detail' in error) {
        console.error('Ошибка БД:', {
          code: (error as any).code,
          detail: (error as any).detail,
          constraint: (error as any).constraint
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении участника',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  // Заглушка
  res.json({ success: true, message: 'Участник удален' });
};

export const getPoints = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({ 
      where: { 
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      } 
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на просмотр этого путешествия'
      });
    }

    // Получаем все точки маршрута
    const points = await pointRepository.find({
      where: { tripId: id },
      order: { order: 'ASC' }
    });

    console.log(`Получено ${points.length} точек для маршрута ${id}`);

    res.json({
      success: true,
      data: points
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении точек маршрута'
    });
  }
};

export const addPoint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, lat, lng, order = 0 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    // Проверка обязательных полей
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название, широту и долготу'
      });
    }

    console.log(`Добавление точки: tripId=${id}, name=${name}, lat=${lat}, lng=${lng}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа (только владелец или активный участник может добавлять точки)
    const participant = await participantRepository.findOne({ 
      where: { 
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      } 
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Создание новой точки
    const point = pointRepository.create({
      name,
      description,
      lat,
      lng,
      order,
      tripId: id
    });

    console.log('Создание точки:', point);

    const savedPoint = await pointRepository.save(point);
    console.log('Точка успешно сохранена:', savedPoint);

    res.status(201).json({
      success: true,
      data: savedPoint
    });
  } catch (error) {
    console.error('Add point error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении точки'
    });
  }
};

export const updatePoint = async (req: Request, res: Response) => {
  try {
    const { id, pointId } = req.params;
    const { name, description, lat, lng, order } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    console.log(`Обновление точки: pointId=${pointId}, tripId=${id}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({ 
      where: { 
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      } 
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Проверяем существование точки
    const point = await pointRepository.findOne({ 
      where: { 
        id: pointId,
        tripId: id
      } 
    });

    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Точка не найдена или не принадлежит данному путешествию'
      });
    }

    // Обновляем данные точки
    if (name !== undefined) point.name = name;
    if (description !== undefined) point.description = description;
    if (lat !== undefined) point.lat = lat;
    if (lng !== undefined) point.lng = lng;
    if (order !== undefined) point.order = order;

    console.log('Обновление точки:', point);

    const updatedPoint = await pointRepository.save(point);
    console.log('Точка успешно обновлена:', updatedPoint);

    res.json({
      success: true,
      data: updatedPoint
    });
  } catch (error) {
    console.error('Update point error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении точки'
    });
  }
};

export const deletePoint = async (req: Request, res: Response) => {
  try {
    const { id, pointId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    console.log(`Удаление точки: pointId=${pointId}, tripId=${id}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({ 
      where: { 
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      } 
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Проверяем существование точки
    const point = await pointRepository.findOne({ 
      where: { 
        id: pointId,
        tripId: id
      } 
    });

    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Точка не найдена или не принадлежит данному путешествию'
      });
    }

    // Удаляем точку
    await pointRepository.remove(point);

    res.json({
      success: true,
      message: 'Точка успешно удалена'
    });
  } catch (error) {
    console.error('Delete point error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении точки'
    });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на просмотр этого путешествия'
      });
    }

    // Получаем все расходы путешествия
    const expenses = await expenseRepository.find({
      where: { tripId: id },
      relations: ['paidBy', 'splitBetween']
    });

    console.log(`Получено ${expenses.length} расходов для маршрута ${id}`);

    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении расходов путешествия'
    });
  }
};

export const addExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      paidById,
      splitBetween
    } = req.body;
    
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    // Проверка обязательных полей
    if (!category || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать категорию и сумму'
      });
    }

    console.log(`Добавление расхода: tripId=${id}, category=${category}, amount=${amount}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);
    const userRepository = AppDataSource.getRepository(User);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа (только владелец или активный участник может добавлять расходы)
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Создание нового расхода
    const expense = new Expense();
    expense.category = category as ExpenseCategory;
    expense.description = description || '';
    expense.amount = amount;
    expense.tripId = id;

    // Добавляем связи с участником, который заплатил
    if (paidById) {
      const paidByUser = await userRepository.findOne({ where: { id: paidById } });
      if (paidByUser) {
        expense.paidBy = paidByUser;
        expense.paidById = paidById;
      }
    }

    // Добавляем связи с участниками, между которыми разделен расход
    if (splitBetween && Array.isArray(splitBetween)) {
      const users = await userRepository.findBy({ id: In(splitBetween) });
      expense.splitBetween = users;
    }

    console.log('Создание расхода:', expense);

    const savedExpense = await expenseRepository.save(expense);
    console.log('Расход успешно сохранен:', savedExpense);

    res.status(201).json({
      success: true,
      data: savedExpense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении расхода'
    });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    const {
      category,
      description,
      amount,
      paidById,
      splitBetween
    } = req.body;
    
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    console.log(`Обновление расхода: expenseId=${expenseId}, tripId=${id}`);
    console.log('Тело запроса:', req.body);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);
    const userRepository = AppDataSource.getRepository(User);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    console.log('Найдено путешествие:', trip ? 'Да' : 'Нет');
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });
    console.log('Найден участник:', participant ? 'Да' : 'Нет');

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Проверяем существование расхода
    console.log(`Поиск расхода с ID ${expenseId} для путешествия ${id}`);
    const expense = await expenseRepository.findOne({
      where: {
        id: expenseId,
        tripId: id
      },
      relations: ['paidBy', 'splitBetween']
    });
    console.log('Найден расход:', expense ? 'Да' : 'Нет');
    
    if (expense) {
      console.log('Детали расхода:', JSON.stringify(expense, null, 2));
    }

    if (!expense) {
      console.log('Расход не найден. Проверяем, существует ли расход с таким ID вообще...');
      const anyExpense = await expenseRepository.findOne({
        where: { id: expenseId }
      });
      
      if (anyExpense) {
        console.log(`Расход с ID ${expenseId} существует, но привязан к другому путешествию: ${anyExpense.tripId}`);
      } else {
        console.log(`Расход с ID ${expenseId} не найден в базе данных вообще`);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Расход не найден или не принадлежит данному путешествию'
      });
    }

    // Обновляем данные расхода
    if (category !== undefined) expense.category = category as ExpenseCategory;
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    
    // Обновляем связь с пользователем, который заплатил
    if (paidById !== undefined) {
      const paidByUser = await userRepository.findOne({ where: { id: paidById } });
      if (paidByUser) {
        expense.paidBy = paidByUser;
        expense.paidById = paidById;
      }
    }
    
    // Обновляем связи с участниками, между которыми разделен расход
    if (splitBetween !== undefined && Array.isArray(splitBetween)) {
      const users = await userRepository.findBy({ id: In(splitBetween) });
      expense.splitBetween = users;
    }

    console.log('Обновление расхода:', expense);

    const updatedExpense = await expenseRepository.save(expense);
    console.log('Расход успешно обновлен:', updatedExpense);

    res.json({
      success: true,
      data: updatedExpense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    if (error instanceof Error) {
      console.error('Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении расхода',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    console.log(`Удаление расхода: expenseId=${expenseId}, tripId=${id}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого путешествия'
      });
    }

    // Проверяем существование расхода
    const expense = await expenseRepository.findOne({
      where: {
        id: expenseId,
        tripId: id
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Расход не найден или не принадлежит данному путешествию'
      });
    }

    // Удаляем расход
    await expenseRepository.remove(expense);
    console.log(`Расход ${expenseId} успешно удален`);

    res.json({
      success: true,
      message: 'Расход успешно удален'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении расхода'
    });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id, expenseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    console.log(`Получение расхода: expenseId=${expenseId}, tripId=${id}`);

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на просмотр этого путешествия'
      });
    }

    // Проверяем существование расхода
    const expense = await expenseRepository.findOne({
      where: {
        id: expenseId,
        tripId: id
      },
      relations: {
        paidBy: true,
        splitBetween: true
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Расход не найден или не принадлежит данному путешествию'
      });
    }

    console.log('Найден расход:', expense);

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении расхода'
    });
  }
};

// Начало голосования за точки маршрута
export const startVoting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pointIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    if (!pointIds || !Array.isArray(pointIds) || pointIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Для голосования необходимо указать не менее двух точек'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем права доступа (только владелец может начать голосование)
    const participant = await participantRepository.findOne({
      where: {
        tripId: id,
        userId
      }
    });

    if (!participant || participant.role !== ParticipantRole.OWNER) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец путешествия может начать голосование'
      });
    }

    // Проверяем, что все точки существуют и принадлежат данному путешествию
    const points = await pointRepository.find({
      where: { tripId: id }
    });

    const tripPointIds = points.map(p => p.id);
    const validPointIds = pointIds.filter(id => tripPointIds.includes(id));

    if (validPointIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо выбрать не менее двух существующих точек путешествия'
      });
    }

    // Обновляем статус путешествия, чтобы указать, что голосование началось
    trip.status = TripStatus.VOTING;
    await tripRepository.save(trip);

    res.json({
      success: true,
      message: 'Голосование успешно начато',
      data: {
        tripId: id,
        pointIds: validPointIds,
        votingStatus: 'active'
      }
    });
  } catch (error) {
    console.error('Start voting error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при запуске голосования'
    });
  }
};

// Голосование за точку маршрута
export const voteForPoint = async (req: Request, res: Response) => {
  try {
    const { tripId, pointId } = req.params;
    const { value, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({
        success: false,
        message: 'Значение голоса должно быть от 1 до 5'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);
    const voteRepository = AppDataSource.getRepository(Vote);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем, что путешествие находится в статусе голосования
    if (trip.status !== TripStatus.VOTING) {
      return res.status(400).json({
        success: false,
        message: 'Голосование для этого путешествия не активно'
      });
    }

    // Проверяем, что пользователь является участником путешествия
    const participant = await participantRepository.findOne({
      where: {
        tripId,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Только участники путешествия могут голосовать'
      });
    }

    // Проверяем существование точки
    const point = await pointRepository.findOne({
      where: {
        id: pointId,
        tripId
      }
    });

    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Точка не найдена или не принадлежит данному путешествию'
      });
    }

    // Проверяем, не голосовал ли уже пользователь за эту точку
    let vote = await voteRepository.findOne({
      where: {
        userId,
        pointId
      }
    });

    if (vote) {
      // Обновляем существующий голос
      vote.value = value;
      if (comment !== undefined) {
        vote.comment = comment;
      }
    } else {
      // Создаем новый голос
      vote = voteRepository.create({
        userId,
        pointId,
        value,
        comment
      });
    }

    await voteRepository.save(vote);

    res.json({
      success: true,
      message: 'Голос успешно учтен',
      data: vote
    });
  } catch (error) {
    console.error('Vote for point error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при голосовании'
    });
  }
};

// Получение результатов голосования
export const getVotingResults = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
    }

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const pointRepository = AppDataSource.getRepository(Point);
    const voteRepository = AppDataSource.getRepository(Vote);

    // Проверяем существование путешествия
    const trip = await tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Путешествие не найдено'
      });
    }

    // Проверяем, что пользователь имеет доступ к путешествию
    const participant = await participantRepository.findOne({
      where: {
        tripId,
        userId,
        status: ParticipantStatus.ACCEPTED
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на просмотр результатов голосования'
      });
    }

    // Получаем все точки путешествия с голосами
    const points = await pointRepository.find({
      where: { tripId },
      relations: ['votes', 'votes.user']
    });

    // Подсчитываем результаты
    const results = points.map(point => {
      const votes = point.votes || [];
      const totalVotes = votes.length;
      const averageRating = totalVotes > 0
        ? votes.reduce((sum, vote) => sum + vote.value, 0) / totalVotes
        : 0;
      
      return {
        pointId: point.id,
        name: point.name,
        description: point.description,
        totalVotes,
        averageRating,
        votes: votes.map(v => ({
          userId: v.userId,
          userName: v.user?.name || 'Неизвестный пользователь',
          value: v.value,
          comment: v.comment
        }))
      };
    });

    // Сортируем результаты по среднему рейтингу (по убыванию)
    results.sort((a, b) => b.averageRating - a.averageRating);

    res.json({
      success: true,
      data: {
        tripId,
        status: trip.status,
        results
      }
    });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении результатов голосования'
    });
  }
};
