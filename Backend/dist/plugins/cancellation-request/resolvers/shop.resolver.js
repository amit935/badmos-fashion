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
exports.ShopCancellationRequestResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const core_1 = require("@vendure/core");
const cancellation_request_service_1 = require("../services/cancellation-request.service");
const cancellation_request_plugin_1 = require("../cancellation-request.plugin");
let ShopCancellationRequestResolver = class ShopCancellationRequestResolver {
    constructor(service, orderService, customerService, connection, historyService) {
        this.service = service;
        this.orderService = orderService;
        this.customerService = customerService;
        this.connection = connection;
        this.historyService = historyService;
    }
    async validateOrderCancellation(ctx, orderCode) {
        var _a, _b, _c, _d;
        // Must be logged in
        if (!ctx.activeUserId) {
            return {
                cancellable: false,
                reason: 'You must be logged in to cancel this order',
            };
        }
        const order = await this.orderService.findOneByCode(ctx, orderCode);
        if (!order) {
            return {
                cancellable: false,
                reason: `Order with code ${orderCode} not found`,
            };
        }
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId);
        if (!customer) {
            return {
                cancellable: false,
                reason: 'No customer account found',
            };
        }
        if (!order.customer || order.customer.id !== customer.id) {
            return {
                cancellable: false,
                reason: 'You do not have permission to cancel this order',
            };
        }
        const orderState = order.state;
        const earlyWindowHours = (_b = (_a = cancellation_request_plugin_1.CancellationRequestPlugin.options) === null || _a === void 0 ? void 0 : _a.earlyCancellationHours) !== null && _b !== void 0 ? _b : 4;
        const postDeliveryWindowDays = (_d = (_c = cancellation_request_plugin_1.CancellationRequestPlugin.options) === null || _c === void 0 ? void 0 : _c.postDeliveryCancellationDays) !== null && _d !== void 0 ? _d : 2;
        const nonCancellableStates = ['Cancelled', 'Refunded'];
        if (nonCancellableStates.includes(orderState)) {
            return {
                cancellable: false,
                reason: `Order cannot be cancelled. Current state: ${orderState}`,
            };
        }
        const earlyCancellableStates = [
            'PaymentSettled',
            'PaymentAuthorized',
            'ArrangingPayment',
        ];
        const processingStates = ['Shipped', 'PartiallyShipped'];
        const deliveredStates = ['Delivered', 'PartiallyDelivered'];
        const now = new Date();
        if (earlyCancellableStates.includes(orderState)) {
            const orderCreatedAt = order.createdAt;
            const earlyWindowMs = earlyWindowHours * 60 * 60 * 1000;
            const earlyCutoffDate = new Date(orderCreatedAt.getTime() + earlyWindowMs);
            if (now > earlyCutoffDate) {
                const createdDateStr = orderCreatedAt.toLocaleString();
                const cutoffDateStr = earlyCutoffDate.toLocaleString();
                return {
                    cancellable: false,
                    reason: `Early cancellation window expired. Orders can only be cancelled within ${earlyWindowHours} hours of placement. ` +
                        `Order placed on: ${createdDateStr}, deadline was: ${cutoffDateStr}. ` +
                        `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`,
                };
            }
            // Within early window
            return {
                cancellable: true,
                reason: null,
            };
        }
        if (processingStates.includes(orderState)) {
            return {
                cancellable: false,
                reason: `Order cannot be cancelled while being processed or shipped. ` +
                    `Current state: ${orderState}. ` +
                    `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`,
            };
        }
        if (deliveredStates.includes(orderState)) {
            const history = await this.historyService.getHistoryForOrder(ctx, order.id, false, { take: 100 });
            const deliveredEvent = history.items.find(h => h.type === 'ORDER_STATE_TRANSITION' &&
                h.data &&
                (h.data.to === 'Delivered' || h.data.to === 'PartiallyDelivered'));
            if (!deliveredEvent) {
                return {
                    cancellable: false,
                    reason: 'Cannot determine delivery date. Please contact support.',
                };
            }
            const deliveredAt = deliveredEvent.createdAt;
            const postDeliveryWindowMs = postDeliveryWindowDays * 24 * 60 * 60 * 1000;
            const cutoffDate = new Date(deliveredAt.getTime() + postDeliveryWindowMs);
            if (now > cutoffDate) {
                const deliveryDateStr = deliveredAt.toLocaleDateString();
                const cutoffDateStr = cutoffDate.toLocaleDateString();
                return {
                    cancellable: false,
                    reason: `Cancellation window expired. Orders can only be cancelled within ${postDeliveryWindowDays} days after delivery. ` +
                        `Delivered on: ${deliveryDateStr}, deadline was: ${cutoffDateStr}.`,
                };
            }
            // Within post-delivery window
            return {
                cancellable: true,
                reason: null,
            };
        }
        return {
            cancellable: false,
            reason: `Order cannot be cancelled in current state: ${orderState}`,
        };
    }
    async requestCancellation(ctx, orderCode, orderLineId, quantity, reason, requestType) {
        var _a, _b, _c, _d;
        // Find the order
        const order = await this.orderService.findOneByCode(ctx, orderCode);
        if (!order) {
            throw new core_1.UserInputError(`Order with code ${orderCode} not found`);
        }
        // Get the current customer from the active user
        if (!ctx.activeUserId) {
            throw new core_1.UserInputError('You must be logged in to request cancellation');
        }
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId);
        if (!customer) {
            throw new core_1.UserInputError('No customer account found');
        }
        // Verify ownership
        if (!order.customer || order.customer.id !== customer.id) {
            throw new core_1.UserInputError('You do not have permission to cancel this order');
        }
        // ============ CANCELLATION WINDOW VALIDATION ============
        const orderState = order.state;
        const earlyWindowHours = (_b = (_a = cancellation_request_plugin_1.CancellationRequestPlugin.options) === null || _a === void 0 ? void 0 : _a.earlyCancellationHours) !== null && _b !== void 0 ? _b : 4;
        const postDeliveryWindowDays = (_d = (_c = cancellation_request_plugin_1.CancellationRequestPlugin.options) === null || _c === void 0 ? void 0 : _c.postDeliveryCancellationDays) !== null && _d !== void 0 ? _d : 2;
        const nonCancellableStates = ['Cancelled', 'Refunded'];
        if (nonCancellableStates.includes(orderState)) {
            throw new core_1.UserInputError(`Order cannot be cancelled. Current state: ${orderState}`);
        }
        const earlyCancellableStates = [
            'PaymentSettled',
            'PaymentAuthorized',
            'ArrangingPayment',
        ];
        const processingStates = ['Shipped', 'PartiallyShipped'];
        const deliveredStates = ['Delivered', 'PartiallyDelivered'];
        const now = new Date(); // ✅ Moved up for reuse
        if (earlyCancellableStates.includes(orderState)) {
            const orderCreatedAt = order.createdAt;
            const earlyWindowMs = earlyWindowHours * 60 * 60 * 1000;
            const earlyCutoffDate = new Date(orderCreatedAt.getTime() + earlyWindowMs);
            if (now > earlyCutoffDate) {
                const createdDateStr = orderCreatedAt.toLocaleString();
                const cutoffDateStr = earlyCutoffDate.toLocaleString();
                throw new core_1.UserInputError(`Early cancellation window expired. Orders can only be cancelled within ${earlyWindowHours} hours of placement. ` +
                    `Order placed on: ${createdDateStr}, Deadline was: ${cutoffDateStr}. ` +
                    `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`);
            }
            // Within early window - allow cancellation
        }
        else if (processingStates.includes(orderState)) {
            throw new core_1.UserInputError(`Order cannot be cancelled while being processed or shipped. ` +
                `Current state: ${orderState}. ` +
                `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`);
        }
        else if (deliveredStates.includes(orderState)) {
            const history = await this.historyService.getHistoryForOrder(ctx, order.id, false, { take: 100 });
            const deliveredEvent = history.items.find(h => h.type === 'ORDER_STATE_TRANSITION' &&
                h.data &&
                (h.data.to === 'Delivered' || h.data.to === 'PartiallyDelivered'));
            if (!deliveredEvent) {
                throw new core_1.UserInputError('Cannot determine delivery date. Please contact support.');
            }
            const deliveredAt = deliveredEvent.createdAt;
            const postDeliveryWindowMs = postDeliveryWindowDays * 24 * 60 * 60 * 1000;
            const cutoffDate = new Date(deliveredAt.getTime() + postDeliveryWindowMs);
            if (now > cutoffDate) {
                const deliveryDateStr = deliveredAt.toLocaleDateString();
                const cutoffDateStr = cutoffDate.toLocaleDateString();
                throw new core_1.UserInputError(`Cancellation window expired. Orders can only be cancelled within ${postDeliveryWindowDays} days after delivery. ` +
                    `Delivered on: ${deliveryDateStr}, Deadline was: ${cutoffDateStr}`);
            }
            // Within post-delivery window - allow cancellation
        }
        else {
            throw new core_1.UserInputError(`Order cannot be cancelled in current state: ${orderState}`);
        }
        // ========================================================
        // Find the order line
        const line = order.lines.find(l => l.id === orderLineId);
        if (!line) {
            throw new core_1.UserInputError(`Order line ${orderLineId} not found in this order`);
        }
        if (quantity <= 0) {
            throw new core_1.UserInputError('Quantity must be greater than 0');
        }
        // ✅ FIXED: Use service method with orderCode
        const existingRequests = await this.service.findByOrderCode(ctx, orderCode);
        const totalRequestedQuantity = existingRequests
            .filter(req => req.orderLineId === orderLineId && req.status === 'PENDING')
            .reduce((sum, req) => sum + req.requestedQuantity, 0);
        const remainingQuantity = line.quantity - totalRequestedQuantity;
        if (remainingQuantity <= 0) {
            throw new core_1.UserInputError(`All ${line.quantity} units of this item already have pending cancellation requests`);
        }
        if (quantity > remainingQuantity) {
            throw new core_1.UserInputError(`Cannot request cancellation of ${quantity} units. ` +
                `Original quantity: ${line.quantity}, ` +
                `Already requested: ${totalRequestedQuantity}, ` +
                `Available for cancellation: ${remainingQuantity}`);
        }
        if (quantity > line.quantity) {
            throw new core_1.UserInputError(`Cannot request cancellation of ${quantity} units. Order only contains ${line.quantity} units of this item`);
        }
        // ✅ FIXED: Pass orderCode instead of orderId
        return this.service.create(ctx, {
            orderId: String(order.id),
            orderCode, // ✅ Now matches service input
            orderLineId,
            requestType: requestType,
            requestedQuantity: quantity,
            reason,
            requestedBy: customer.emailAddress,
        });
    }
    async orderCancellationRequests(ctx, orderCode) {
        return this.service.findByOrderCode(ctx, orderCode);
    }
};
exports.ShopCancellationRequestResolver = ShopCancellationRequestResolver;
__decorate([
    (0, graphql_1.Query)(),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('orderCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String]),
    __metadata("design:returntype", Promise)
], ShopCancellationRequestResolver.prototype, "validateOrderCancellation", null);
__decorate([
    (0, graphql_1.Mutation)(),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('orderCode')),
    __param(2, (0, graphql_1.Args)('orderLineId')),
    __param(3, (0, graphql_1.Args)('quantity')),
    __param(4, (0, graphql_1.Args)('reason')),
    __param(5, (0, graphql_1.Args)('requestType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String, String, Number, String, String]),
    __metadata("design:returntype", Promise)
], ShopCancellationRequestResolver.prototype, "requestCancellation", null);
__decorate([
    (0, graphql_1.Query)(),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)('orderCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, String]),
    __metadata("design:returntype", Promise)
], ShopCancellationRequestResolver.prototype, "orderCancellationRequests", null);
exports.ShopCancellationRequestResolver = ShopCancellationRequestResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [cancellation_request_service_1.CancellationRequestService,
        core_1.OrderService,
        core_1.CustomerService,
        core_1.TransactionalConnection,
        core_1.HistoryService])
], ShopCancellationRequestResolver);
