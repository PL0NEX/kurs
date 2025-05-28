import 'dotenv/config';
import { AppDataSource } from '../config/data-source';
import { Trip, TripStatus } from '../models/Trip';
import { Participant, ParticipantRole, ParticipantStatus } from '../models/Participant';
import { Expense, ExpenseCategory } from '../models/Expense';
import { Point } from '../models/Point';
import { User } from '../models/User';

async function createTestTrips() {
  try {
    // Инициализация подключения к базе данных
    await AppDataSource.initialize();
    console.log('База данных подключена');

    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const expenseRepository = AppDataSource.getRepository(Expense);
    const userRepository = AppDataSource.getRepository(User);
    const pointRepository = AppDataSource.getRepository(Point);

    // ID пользователя a@mail.ru
    const userId = 'a830b9d2-ab4e-42ce-8fb5-ad8573545683';
    
    // Проверка существования пользователя
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      console.error('Пользователь с ID', userId, 'не найден');
      await AppDataSource.destroy();
      return;
    }

    console.log('Найден пользователь:', user.email);

    // Находим все путешествия пользователя
    const userTrips = await tripRepository.find({ where: { ownerId: userId } });
    console.log(`Найдено ${userTrips.length} путешествий пользователя`);

    // Удаляем все существующие данные путешествий пользователя
    console.log('Удаление существующих данных...');
    
    for (const trip of userTrips) {
      // Удаляем расходы
      await expenseRepository.delete({ tripId: trip.id });
      console.log(`  Удалены расходы для путешествия ${trip.id}`);
      
      // Удаляем точки
      await pointRepository.delete({ tripId: trip.id });
      console.log(`  Удалены точки для путешествия ${trip.id}`);
      
      // Удаляем участников
      await participantRepository.delete({ tripId: trip.id });
      console.log(`  Удалены участники для путешествия ${trip.id}`);
      
      // Удаляем путешествие
      await tripRepository.delete({ id: trip.id });
      console.log(`  Удалено путешествие ${trip.id}`);
    }

    console.log('Начинаем создание тестовых путешествий...');

    // 1. Отпуск в Сочи
    const sochiTrip = tripRepository.create({
      title: 'Отпуск в Сочи',
      description: 'Летний отдых на море',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-14'),
      status: TripStatus.DRAFT,
      ownerId: userId
    });

    await tripRepository.save(sochiTrip);
    console.log('Создано путешествие "Отпуск в Сочи"');

    // Добавляем владельца как участника
    const sochiParticipant = participantRepository.create({
      trip: sochiTrip,
      user,
      role: ParticipantRole.OWNER,
      status: ParticipantStatus.ACCEPTED
    });

    await participantRepository.save(sochiParticipant);

    // Добавление точек для Сочи
    const sochiPoints = [
      { name: 'Олимпийский парк', lat: 43.4045, lng: 39.9553, description: 'Олимпийские объекты и развлечения' },
      { name: 'Роза Хутор', lat: 43.6559, lng: 40.2551, description: 'Горнолыжный курорт' },
      { name: 'Сочи Парк', lat: 43.4031, lng: 39.9573, description: 'Тематический парк аттракционов' }
    ];

    for (const pointData of sochiPoints) {
      const point = pointRepository.create({
        ...pointData,
        trip: sochiTrip
      });
      await pointRepository.save(point);
    }

    console.log('Добавлены точки для путешествия в Сочи');

    // 2. Путешествие по Алтаю с расходами на авиабилеты
    const altaiTrip = tripRepository.create({
      title: 'Путешествие по Алтаю',
      description: 'Пеший туризм и невероятные пейзажи',
      startDate: new Date('2025-06-05'),
      endDate: new Date('2025-06-15'),
      status: TripStatus.PLANNED,
      ownerId: userId
    });

    await tripRepository.save(altaiTrip);
    console.log('Создано путешествие "Путешествие по Алтаю"');

    // Добавляем владельца как участника
    const altaiParticipant = participantRepository.create({
      trip: altaiTrip,
      user,
      role: ParticipantRole.OWNER,
      status: ParticipantStatus.ACCEPTED
    });

    await participantRepository.save(altaiParticipant);

    // Добавляем расход на авиабилеты
    const altaiExpense = expenseRepository.create({
      description: 'Авиабилеты',
      amount: 25000,
      category: ExpenseCategory.TRANSPORT,
      trip: altaiTrip,
      paidBy: user
    });

    await expenseRepository.save(altaiExpense);
    console.log('Добавлен расход "Авиабилеты" для путешествия по Алтаю');

    // Добавление точек для Алтая
    const altaiPoints = [
      { name: 'Озеро Телецкое', lat: 51.6099, lng: 87.6680, description: 'Красивейшее озеро Алтая' },
      { name: 'Гора Белуха', lat: 49.8076, lng: 86.5900, description: 'Самая высокая гора Алтая' },
      { name: 'Чемальская ГЭС', lat: 51.4109, lng: 86.0012, description: 'Небольшая ГЭС и туристический объект' }
    ];

    for (const pointData of altaiPoints) {
      const point = pointRepository.create({
        ...pointData,
        trip: altaiTrip
      });
      await pointRepository.save(point);
    }

    console.log('Добавлены точки для путешествия по Алтаю');

    // 3. Зимние каникулы в Финляндии с расходами на коттедж
    const finlandTrip = tripRepository.create({
      title: 'Зимние каникулы в Финляндии',
      description: 'Новогоднее приключение с посещением Санта-Клауса',
      startDate: new Date('2025-12-29'),
      endDate: new Date('2026-01-05'),
      status: TripStatus.DRAFT,
      ownerId: userId
    });

    await tripRepository.save(finlandTrip);
    console.log('Создано путешествие "Зимние каникулы в Финляндии"');

    // Добавляем владельца как участника
    const finlandParticipant = participantRepository.create({
      trip: finlandTrip,
      user,
      role: ParticipantRole.OWNER,
      status: ParticipantStatus.ACCEPTED
    });

    await participantRepository.save(finlandParticipant);

    // Добавляем расход на коттедж
    const finlandExpense = expenseRepository.create({
      description: 'Коттедж в Лапландии',
      amount: 45000,
      category: ExpenseCategory.ACCOMMODATION,
      trip: finlandTrip,
      paidBy: user
    });

    await expenseRepository.save(finlandExpense);
    console.log('Добавлен расход "Коттедж в Лапландии" для путешествия в Финляндию');

    // Добавление точек для Финляндии
    const finlandPoints = [
      { name: 'Деревня Санта-Клауса', lat: 66.5436, lng: 25.8472, description: 'Официальная резиденция Санта-Клауса' },
      { name: 'Национальный парк Урхо Кекконена', lat: 68.3826, lng: 27.3998, description: 'Красивый парк для походов' },
      { name: 'Ледокол Самппо', lat: 65.7333, lng: 24.5667, description: 'Круизы на ледоколе и купание в ледяной воде' }
    ];

    for (const pointData of finlandPoints) {
      const point = pointRepository.create({
        ...pointData,
        trip: finlandTrip
      });
      await pointRepository.save(point);
    }

    console.log('Добавлены точки для путешествия в Финляндию');

    console.log('Все тестовые данные успешно созданы!');

    // Закрытие соединения
    await AppDataSource.destroy();
    console.log('Соединение с базой данных закрыто');
  } catch (error) {
    console.error('Ошибка при создании тестовых путешествий:', error);
  }
}

// Запуск функции
createTestTrips(); 