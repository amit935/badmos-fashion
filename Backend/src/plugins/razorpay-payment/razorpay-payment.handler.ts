import {
  CreatePaymentResult,
  CreateRefundResult,
  LanguageCode,
  PaymentMethodHandler,
  SettlePaymentResult,
  Logger,
} from '@vendure/core';
import Razorpay from 'razorpay';

const loggerCtx = 'RazorpayPaymentHandler';

export const razorpayPaymentHandler = new PaymentMethodHandler({
  code: 'razorpay-payment',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'Razorpay Payment Gateway',
    },
  ],
  args: {
    keyId: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Razorpay Key ID' }],
      required: true,
    },
    keySecret: {
      type: 'string',
      label: [{ languageCode: LanguageCode.en, value: 'Razorpay Key Secret' }],
      required: true,
    },
  },

  createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
    try {
      const razorpay = new Razorpay({
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

      Logger.info(`Razorpay order created: ${razorpayOrder.id}`, loggerCtx);

      // Return with Razorpay order ID in metadata
      // The event subscriber will pick this up and update the custom field
      return {
        amount,
        state: 'Authorized' as const,
        transactionId: razorpayOrder.id,
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          public: {
            razorpayOrderId: razorpayOrder.id,
          },
        },
      };
    } catch (error: any) {
      Logger.error(`Razorpay order creation failed: ${error.message}`, loggerCtx);

      return {
        amount,
        state: 'Declined' as const,
        errorMessage: error.message || 'Failed to create Razorpay order',
        metadata: {
          errorDetails: error.message,
        },
      };
    }
  },

settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult> => {
  try {
    const { razorpayOrderId } = payment.metadata || {};

    if (!razorpayOrderId) {
      Logger.error('Missing Razorpay order ID in payment metadata', loggerCtx);
      return {
        success: false,
        errorMessage: 'Missing Razorpay order ID in payment metadata',
      } as any;
    }

    const razorpay = new Razorpay({
      key_id: args.keyId,
      key_secret: args.keySecret,
    });

    const paymentsResponse = await razorpay.orders.fetchPayments(razorpayOrderId);

    if (!paymentsResponse.items || paymentsResponse.items.length === 0) {
      Logger.error(`No payments found for Razorpay order: ${razorpayOrderId}`, loggerCtx);
      return {
        success: false,
        errorMessage: 'No payment found for this order',
      } as any;
    }

    const razorpayPaymentId = paymentsResponse.items[0].id;

    Logger.info(
      `Settling payment for Razorpay order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`,
      loggerCtx
    );

    return {
      success: true,
      metadata: {
        ...(payment.metadata || {}),
        razorpayOrderId,
        razorpayPaymentId,
        public: {
          ...(payment.metadata?.public || {}),
          razorpayOrderId,
          razorpayPaymentId,
        },
      },
    };
  } catch (error: any) {
    Logger.error(`Error settling Razorpay payment: ${error.message}`, loggerCtx);
    return {
      success: false,
      errorMessage: error.message || String(error),
    } as any;
  }
},



  createRefund: async (ctx, input, amount, order, payment, args): Promise<CreateRefundResult> => {
    try {
      const razorpay = new Razorpay({
        key_id: args.keyId,
        key_secret: args.keySecret,
      });

      const razorpayPaymentId = payment.metadata.razorpayPaymentId;

      if (!razorpayPaymentId) {
        return {
          state: 'Failed' as const,
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

      Logger.info(`Razorpay refund created: ${refund.id}`, loggerCtx);

      return {
        state: 'Settled' as const,
        transactionId: refund.id,
        metadata: {
          refundId: refund.id,
        },
      };
    } catch (error: any) {
      Logger.error(`Razorpay refund failed: ${error.message}`, loggerCtx);
      return {
        state: 'Failed' as const,
        metadata: { errorMessage: error.message },
      };
    }
  },
});
