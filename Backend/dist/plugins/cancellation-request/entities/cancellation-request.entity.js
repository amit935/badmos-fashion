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
exports.CancellationRequest = void 0;
const typeorm_1 = require("typeorm");
const core_1 = require("@vendure/core");
let CancellationRequest = class CancellationRequest extends core_1.VendureEntity {
    constructor(input) {
        super(input);
    }
};
exports.CancellationRequest = CancellationRequest;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CancellationRequest.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CancellationRequest.prototype, "orderCode", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => core_1.Order, { onDelete: 'CASCADE' }),
    __metadata("design:type", core_1.Order)
], CancellationRequest.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CancellationRequest.prototype, "orderLineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => core_1.OrderLine, { onDelete: 'CASCADE' }),
    __metadata("design:type", core_1.OrderLine)
], CancellationRequest.prototype, "orderLine", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], CancellationRequest.prototype, "requestType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CancellationRequest.prototype, "requestedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'PENDING' }),
    __metadata("design:type", String)
], CancellationRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CancellationRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CancellationRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CancellationRequest.prototype, "adminNote", void 0);
exports.CancellationRequest = CancellationRequest = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], CancellationRequest);
