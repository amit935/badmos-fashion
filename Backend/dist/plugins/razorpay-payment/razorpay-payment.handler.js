"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayPaymentHandler = void 0;
const core_1 = require("@vendure/core");
const razorpay_1 = __importDefault(require("razorpay"));
const loggerCtx = 'RazorpayPaymentHandler';
exports.razorpayPaymentHandler = new core_1.PaymentMethodHandler({
    code: 'razorpay-payment',
    description: [
        {
            languageCode: core_1.LanguageCode.en,
            value: 'Razorpay Payment Gateway',
        },
    ],
    args: {
        keyId: {
            type: 'string',
            label: [{ languageCode: core_1.LanguageCode.en, value: 'Razorpay Key ID' }],
            required: true,
        },
        keySecret: {
            type: 'string',
            label: [{ languageCode: core_1.LanguageCode.en, value: 'Razorpay Key Secret' }],
            required: true,
        },
    },
    createPayment: async (ctx, order, amount, args, metadata) => {
        try {
            const razorpay = new razorpay_1.default({
                key_id: args.keyId,
                key_secret: args.keySecret,
            });
            const razorpayOrder = await razorpay.orders.create({
                amount: amount,
                currency: order.currencyCode,
                receipt: order.code,
                notes: {
                    orderId: order.id,
                    orderCode: order.code,
                },
            });
            core_1.Logger.info(`Razorpay order created: ${razorpayOrder.id}`, loggerCtx);
            // Return with Razorpay order ID in metadata
            // The event subscriber will pick this up and update the custom field
            return {
                amount,
                state: 'Authorized',
                transactionId: razorpayOrder.id,
                metadata: {
                    razorpayOrderId: razorpayOrder.id,
                    public: {
                        razorpayOrderId: razorpayOrder.id,
                    },
                },
            };
        }
        catch (error) {
            core_1.Logger.error(`Razorpay order creation failed: ${error.message}`, loggerCtx);
            return {
                amount,
                state: 'Declined',
                errorMessage: error.message || 'Failed to create Razorpay order',
                metadata: {
                    errorDetails: error.message,
                },
            };
        }
    },
    settlePayment: async (ctx, order, payment, args) => {
        var _a;
        try {
            const { razorpayOrderId } = payment.metadata || {};
            if (!razorpayOrderId) {
                core_1.Logger.error('Missing Razorpay order ID in payment metadata', loggerCtx);
                return {
                    success: false,
                    errorMessage: 'Missing Razorpay order ID in payment metadata',
                };
            }
            const razorpay = new razorpay_1.default({
                key_id: args.keyId,
                key_secret: args.keySecret,
            });
            const paymentsResponse = await razorpay.orders.fetchPayments(razorpayOrderId);
            if (!paymentsResponse.items || paymentsResponse.items.length === 0) {
                core_1.Logger.error(`No payments found for Razorpay order: ${razorpayOrderId}`, loggerCtx);
                return {
                    success: false,
                    errorMessage: 'No payment found for this order',
                };
            }
            const razorpayPaymentId = paymentsResponse.items[0].id;
            core_1.Logger.info(`Settling payment for Razorpay order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`, loggerCtx);
            return {
                success: true,
                metadata: {
                    ...(payment.metadata || {}),
                    razorpayOrderId,
                    razorpayPaymentId,
                    public: {
                        ...(((_a = payment.metadata) === null || _a === void 0 ? void 0 : _a.public) || {}),
                        razorpayOrderId,
                        razorpayPaymentId,
                    },
                },
            };
        }
        catch (error) {
            core_1.Logger.error(`Error settling Razorpay payment: ${error.message}`, loggerCtx);
            return {
                success: false,
                errorMessage: error.message || String(error),
            };
        }
    },
    createRefund: async (ctx, input, amount, order, payment, args) => {
        try {
            const razorpay = new razorpay_1.default({
                key_id: args.keyId,
                key_secret: args.keySecret,
            });
            const razorpayPaymentId = payment.metadata.razorpayPaymentId;
            if (!razorpayPaymentId) {
                return {
                    state: 'Failed',
                    metadata: { errorMessage: 'Missing Razorpay payment ID for refund' },
                };
            }
            const refund = await razorpay.payments.refund(razorpayPaymentId, {
                amount: amount,
                notes: {
                    orderId: order.id,
                    orderCode: order.code,
                },
            });
            core_1.Logger.info(`Razorpay refund created: ${refund.id}`, loggerCtx);
            return {
                state: 'Settled',
                transactionId: refund.id,
                metadata: {
                    refundId: refund.id,
                },
            };
        }
        catch (error) {
            core_1.Logger.error(`Razorpay refund failed: ${error.message}`, loggerCtx);
            return {
                state: 'Failed',
                metadata: { errorMessage: error.message },
            };
        }
    },
});
