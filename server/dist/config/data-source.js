"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const Trip_1 = require("../models/Trip");
const Point_1 = require("../models/Point");
const Participant_1 = require("../models/Participant");
const Expense_1 = require("../models/Expense");
const Vote_1 = require("../models/Vote");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'tripplanner',
    synchronize: process.env.NODE_ENV === 'development', // Automatically create database schema in development
    logging: process.env.NODE_ENV === 'development',
    entities: [User_1.User, Trip_1.Trip, Point_1.Point, Participant_1.Participant, Expense_1.Expense, Vote_1.Vote],
    migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
    subscribers: []
});
