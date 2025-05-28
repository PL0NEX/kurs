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
exports.Participant = exports.ParticipantStatus = exports.ParticipantRole = void 0;
const typeorm_1 = require("typeorm");
const Trip_1 = require("./Trip");
const User_1 = require("./User");
var ParticipantRole;
(function (ParticipantRole) {
    ParticipantRole["OWNER"] = "owner";
    ParticipantRole["EDITOR"] = "editor";
    ParticipantRole["VIEWER"] = "viewer";
})(ParticipantRole || (exports.ParticipantRole = ParticipantRole = {}));
var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["PENDING"] = "pending";
    ParticipantStatus["ACCEPTED"] = "accepted";
    ParticipantStatus["DECLINED"] = "declined";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
let Participant = class Participant {
};
exports.Participant = Participant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Participant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Trip_1.Trip, trip => trip.participants, {
        onDelete: 'CASCADE'
    }),
    (0, typeorm_1.JoinColumn)({ name: 'tripId' }),
    __metadata("design:type", Trip_1.Trip)
], Participant.prototype, "trip", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Participant.prototype, "tripId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.participations),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], Participant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Participant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParticipantRole,
        default: ParticipantRole.VIEWER
    }),
    __metadata("design:type", String)
], Participant.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParticipantStatus,
        default: ParticipantStatus.PENDING
    }),
    __metadata("design:type", String)
], Participant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Participant.prototype, "invitedEmail", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Participant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Participant.prototype, "updatedAt", void 0);
exports.Participant = Participant = __decorate([
    (0, typeorm_1.Entity)('participants')
], Participant);
