"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trip = exports.TripStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Point_1 = require("./Point");
const Participant_1 = require("./Participant");
const Expense_1 = require("./Expense");
var TripStatus;
(function (TripStatus) {
    TripStatus["DRAFT"] = "draft";
    TripStatus["PLANNED"] = "planned";
    TripStatus["ACTIVE"] = "active";
    TripStatus["COMPLETED"] = "completed";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
let Trip = class Trip {
    // Вычисляемое поле (не хранится в БД)
    get totalBudget() {
        if (!this.expenses || this.expenses.length === 0)
            return 0;
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }
};
exports.Trip = Trip;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Trip.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Trip.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Trip.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Trip.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Trip.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TripStatus,
        default: TripStatus.DRAFT
    }),
    __metadata("design:type", String)
], Trip.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Trip.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.ownedTrips),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", User_1.User)
], Trip.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Trip.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Point_1.Point, point => point.trip, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Trip.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Participant_1.Participant, participant => participant.trip, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Trip.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Expense_1.Expense, expense => expense.trip, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Trip.prototype, "expenses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Trip.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Trip.prototype, "updatedAt", void 0);
exports.Trip = Trip = __decorate([
    (0, typeorm_1.Entity)('trips')
], Trip);
