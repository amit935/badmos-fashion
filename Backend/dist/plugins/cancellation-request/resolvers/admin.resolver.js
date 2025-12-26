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
exports.AdminCancellationRequestResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const core_1 = require("@vendure/core");
const cancellation_request_service_1 = require("../services/cancellation-request.service");
let AdminCancellationRequestResolver = class AdminCancellationRequestResolver {
    constructor(service) {
        this.service = service;
    }
    async cancellationRequests(ctx, skip, take) {
        return this.service.findAll(ctx, skip, take);
    }
    async cancellationRequest(ctx, id) {
        return this.service.findById(ctx, id);
    }
    async orderCancellationRequests(ctx, orderCode) {
        return this.service.findByOrderCode(ctx, orderCode); // ✅ Fixed
    }
    async approveCancellationRequest(ctx, id, adminNote) {
        return this.service.approve(ctx, id, adminNote);
    }
    async rejectCancellationRequest(ctx, id, adminNote) {
        return this.service.reject(ctx, id, adminNote);
    }
    async deleteCancellationRequest(ctx, id) {
        return this.service.delete(ctx, id);
    }
};
exports.AdminCancellationRequestResolver = AdminCancellationRequestResolver;
__decorate([
    (0, graphql_1.Query)(),
    (0, core_1.Allow)(core_1.Permission.ReadOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('skip')),
    __param(2, (0, graphql_1.Args)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "cancellationRequests", null);
__decorate([
    (0, graphql_1.Query)(),
    (0, core_1.Allow)(core_1.Permission.ReadOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "cancellationRequest", null);
__decorate([
    (0, graphql_1.Query)(),
    (0, core_1.Allow)(core_1.Permission.ReadOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('orderCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "orderCancellationRequests", null);
__decorate([
    (0, graphql_1.Mutation)(),
    (0, core_1.Allow)(core_1.Permission.UpdateOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('id')),
    __param(2, (0, graphql_1.Args)('adminNote', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String, String]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "approveCancellationRequest", null);
__decorate([
    (0, graphql_1.Mutation)(),
    (0, core_1.Allow)(core_1.Permission.UpdateOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('id')),
    __param(2, (0, graphql_1.Args)('adminNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String, String]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "rejectCancellationRequest", null);
__decorate([
    (0, graphql_1.Mutation)(),
    (0, core_1.Allow)(core_1.Permission.DeleteOrder),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String]),
    __metadata("design:returntype", Promise)
], AdminCancellationRequestResolver.prototype, "deleteCancellationRequest", null);
exports.AdminCancellationRequestResolver = AdminCancellationRequestResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [cancellation_request_service_1.CancellationRequestService])
], AdminCancellationRequestResolver);
