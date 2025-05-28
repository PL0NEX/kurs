import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { Point } from '../models/Point';
import { Participant } from '../models/Participant';
import { Expense } from '../models/Expense';
import { Vote } from '../models/Vote';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'trip_planner',
  synchronize: true, // Автоматически создаем схему базы данных
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Trip, Point, Participant, Expense, Vote],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  subscribers: []
}); 