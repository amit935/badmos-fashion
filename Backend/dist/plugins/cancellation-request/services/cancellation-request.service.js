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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationRequestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cancellation_request_entity_1 = require("../entities/cancellation-request.entity");
let CancellationRequestService = class CancellationRequestService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(ctx, input) {
        const req = this.repo.create({
            ...input,
            status: 'PENDING',
        });
        return this.repo.save(req);
    }
    async findAll(ctx, skip = 0, take = 20) {
        const [items, total] = await this.repo.findAndCount({
            skip,
            take,
            order: { createdAt: 'DESC' },
        });
        return { items, total };
    }
    async findById(ctx, id) {
        return this.repo.findOne({ where: { id } });
    }
    async findByOrderId(ctx, orderId) {
        return this.repo.find({
            where: { orderId },
            order: { createdAt: 'DESC' },
        });
    }
    async findByOrderCode(ctx, orderCode) {
        return this.repo.find({
            where: { orderCode },
            relations: ['order', 'orderLine'],
            order: { createdAt: 'DESC' },
        });
    }
    async approve(ctx, id, adminNote) {
        const req = await this.findById(ctx, id);
        if (!req) {
            throw new Error(`CancellationRequest ${id} not found`);
        }
        req.status = 'APPROVED';
        if (adminNote)
            req.adminNote = adminNote;
        return this.repo.save(req);
    }
    async reject(ctx, id, adminNote) {
        const req = await this.findById(ctx, id);
        if (!req) {
            throw new Error(`CancellationRequest ${id} not found`);
        }
        req.status = 'REJECTED';
        req.adminNote = adminNote;
        return this.repo.save(req);
    }
    async delete(ctx, id) {
        const result = await this.repo.delete(id);
        return !!result.affected && result.affected > 0;
    }
};
exports.CancellationRequestService = CancellationRequestService;
exports.CancellationRequestService = CancellationRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cancellation_request_entity_1.CancellationRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CancellationRequestService);
