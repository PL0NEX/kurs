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
exports.Point = void 0;
const typeorm_1 = require("typeorm");
const Trip_1 = require("./Trip");
const Vote_1 = require("./Vote");
let Point = class Point {
};
exports.Point = Point;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Point.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Point.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Point.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 6 }),
    __metadata("design:type", Number)
], Point.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 6 }),
    __metadata("design:type", Number)
], Point.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Point.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Trip_1.Trip, trip => trip.points, {
        onDelete: 'CASCADE'
    }),
    (0, typeorm_1.JoinColumn)({ name: 'tripId' }),
    __metadata("design:type", Trip_1.Trip)
], Point.prototype, "trip", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Point.prototype, "tripId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Vote_1.Vote, vote => vote.point),
    __metadata("design:type", Array)
], Point.prototype, "votes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Point.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Point.prototype, "updatedAt", void 0);
exports.Point = Point = __decorate([
    (0, typeorm_1.Entity)('points')
], Point);
