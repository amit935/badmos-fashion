"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RazorpayWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayWebhookController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const core_1 = require("@vendure/core");
let RazorpayWebhookController = RazorpayWebhookController_1 = class RazorpayWebhookController {
    constructor(orderService, paymentService, requestContextService, connection) {
        this.orderService = orderService;
        this.paymentService = paymentService;
        this.requestContextService = requestContextService;
        this.connection = connection;
        this.logger = new common_1.Logger(RazorpayWebhookController_1.name);
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    }
    async handleWebhook(req, res) {
        var _a;
        if (!this.webhookSecret) {
            this.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook secret not configured');
        }
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(body)
            .digest('hex');
        if (signature !== expectedSignature) {
            this.logger.warn('Invalid Razorpay webhook signature');
            return res.status(common_1.HttpStatus.BAD_REQUEST).send('Invalid signature');
        }
        this.logger.log('Valid Razorpay webhook received');
        const event = req.body.event;
        const payloadData = req.body.payload;
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        try {
            if (event === 'payment.captured') {
                let razorpayOrderId;
                let razorpayPaymentId;
                let razorpayPaymentSignature;
                if (event === 'payment.captured') {
                    const paymentEntity = payloadData.payment.entity;
                    razorpayOrderId = paymentEntity.order_id;
                    razorpayPaymentId = paymentEntity.id;
                    razorpayPaymentSignature = (_a = paymentEntity.acquirer_data) === null || _a === void 0 ? void 0 : _a.razorpay_signature;
                    this.logger.log(`Handling payment.captured for Razorpay order: ${razorpayOrderId}`);
                }
                else {
                    const orderEntity = payloadData.order.entity;
                    razorpayOrderId = orderEntity.id;
                    this.logger.log(`Handling order.paid for Razorpay order: ${razorpayOrderId}`);
                }
                const order = await this.findOrderByRazorpayOrderIdWithRetry(ctx, razorpayOrderId);
                if (!order) {
                    this.logger.warn(`Order not found for Razorpay order ID: ${razorpayOrderId}`);
                    return res.status(common_1.HttpStatus.OK).send('Order not found');
                }
                this.logger.log(`Found order ${order.code}, current state: ${order.state}`);
                const payment = await this.connection
                    .getRepository(ctx, core_1.Payment)
                    .createQueryBuilder('payment')
                    .where('payment.orderId = :orderId', { orderId: order.id })
                    .andWhere('payment.transactionId = :transactionId', { transactionId: razorpayOrderId })
                    .getOne();
                if (!payment) {
                    this.logger.warn(`Payment not found for order ${order.code}`);
                    return res.status(common_1.HttpStatus.OK).send('Payment not found');
                }
                if (razorpayPaymentId && razorpayPaymentSignature) {
                    payment.metadata = {
                        ...payment.metadata,
                        razorpayPaymentId,
                        razorpaySignature: razorpayPaymentSignature,
                    };
                    await this.connection.getRepository(ctx, core_1.Payment).save(payment);
                    this.logger.log('Razorpay payment metadata updated');
                }
                if (payment.state !== 'Settled') {
                    await this.paymentService.settlePayment(ctx, payment.id);
                    this.logger.log(`✅ Payment ${payment.id} settled successfully`);
                }
                const updatedOrder = await this.orderService.findOne(ctx, order.id);
                this.logger.log(`Order ${order.code} current state: ${updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.state}`);
                return res.send('Webhook processed successfully');
            }
            else {
                this.logger.log(`Event ${event} not handled`);
                return res.send('Unhandled event ignored');
            }
        }
        catch (error) {
            this.logger.error('Error processing webhook', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).send('Internal Server Error');
        }
    }
    async findOrderByRazorpayOrderId(ctx, razorpayOrderId) {
        try {
            const payment = await this.connection
                .getRepository(ctx, core_1.Payment)
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.order', 'order')
                .where('payment.transactionId = :razorpayOrderId', { razorpayOrderId })
                .getOne();
            return payment === null || payment === void 0 ? void 0 : payment.order;
        }
        catch (error) {
            this.logger.error(`Error finding order by Razorpay order ID: ${razorpayOrderId}`, error);
            return undefined;
        }
    }
    async findOrderByRazorpayOrderIdWithRetry(ctx, razorpayOrderId, attempts = 5, delayMs = 2000) {
        for (let i = 0; i < attempts; i++) {
            const order = await this.findOrderByRazorpayOrderId(ctx, razorpayOrderId);
            if (order) {
                return order;
            }
            this.logger.log(`Retry ${i + 1}/${attempts} for Razorpay order ID ${razorpayOrderId}`);
            await new Promise(res => setTimeout(res, delayMs));
        }
        return undefined;
    }
};
exports.RazorpayWebhookController = RazorpayWebhookController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RazorpayWebhookController.prototype, "handleWebhook", null);
exports.RazorpayWebhookController = RazorpayWebhookController = RazorpayWebhookController_1 = __decorate([
    (0, common_1.Controller)('api/razorpay'),
    __metadata("design:paramtypes", [core_1.OrderService,
        core_1.PaymentService,
        core_1.RequestContextService,
        core_1.TransactionalConnection])
], RazorpayWebhookController);
