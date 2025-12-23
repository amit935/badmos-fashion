import { Controller, Post, Req, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import {
  RequestContextService,
  OrderService,
  RequestContext,
  Order,
  Payment,
  TransactionalConnection,
  PaymentService,
} from '@vendure/core';

@Controller('api/razorpay')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);
  private readonly webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private requestContextService: RequestContextService,
    private connection: TransactionalConnection,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    if (!this.webhookSecret) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook secret not configured');
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.logger.warn('Invalid Razorpay webhook signature');
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
    }

    this.logger.log('Valid Razorpay webhook received');

    const event = req.body.event;
    const payloadData = req.body.payload;
    const ctx: RequestContext = await this.requestContextService.create({ apiType: 'admin' });

    try {
      if (event === 'payment.captured') {
        let razorpayOrderId: string;
        let razorpayPaymentId: string | undefined;
        let razorpayPaymentSignature: string | undefined;

        if (event === 'payment.captured') {
          const paymentEntity = payloadData.payment.entity;
          razorpayOrderId = paymentEntity.order_id;
          razorpayPaymentId = paymentEntity.id;
          razorpayPaymentSignature = paymentEntity.acquirer_data?.razorpay_signature;
          this.logger.log(`Handling payment.captured for Razorpay order: ${razorpayOrderId}`);
        } else {
          const orderEntity = payloadData.order.entity;
          razorpayOrderId = orderEntity.id;
          this.logger.log(`Handling order.paid for Razorpay order: ${razorpayOrderId}`);
        }

        const order = await this.findOrderByRazorpayOrderIdWithRetry(ctx, razorpayOrderId);

        if (!order) {
          this.logger.warn(`Order not found for Razorpay order ID: ${razorpayOrderId}`);
          return res.status(HttpStatus.OK).send('Order not found');
        }

        this.logger.log(`Found order ${order.code}, current state: ${order.state}`);

        const payment = await this.connection
          .getRepository(ctx, Payment)
          .createQueryBuilder('payment')
          .where('payment.orderId = :orderId', { orderId: order.id })
          .andWhere('payment.transactionId = :transactionId', { transactionId: razorpayOrderId })
          .getOne();

        if (!payment) {
          this.logger.warn(`Payment not found for order ${order.code}`);
          return res.status(HttpStatus.OK).send('Payment not found');
        }

        if (razorpayPaymentId && razorpayPaymentSignature) {
          payment.metadata = {
            ...payment.metadata,
            razorpayPaymentId,
            razorpaySignature: razorpayPaymentSignature,
          };
          await this.connection.getRepository(ctx, Payment).save(payment);
          this.logger.log('Razorpay payment metadata updated');
        }

        if (payment.state !== 'Settled') {
          await this.paymentService.settlePayment(ctx, payment.id);
          this.logger.log(`✅ Payment ${payment.id} settled successfully`);
        }

        const updatedOrder = await this.orderService.findOne(ctx, order.id);
        this.logger.log(`Order ${order.code} current state: ${updatedOrder?.state}`);

        return res.send('Webhook processed successfully');
      } else {
        this.logger.log(`Event ${event} not handled`);
        return res.send('Unhandled event ignored');
      }
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }
  }

  private async findOrderByRazorpayOrderId(
    ctx: RequestContext,
    razorpayOrderId: string,
  ): Promise<Order | undefined> {
    try {
      const payment = await this.connection
        .getRepository(ctx, Payment)
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.order', 'order')
        .where('payment.transactionId = :razorpayOrderId', { razorpayOrderId })
        .getOne();

      return payment?.order;
    } catch (error) {
      this.logger.error(`Error finding order by Razorpay order ID: ${razorpayOrderId}`, error);
      return undefined;
    }
  }

  private async findOrderByRazorpayOrderIdWithRetry(
    ctx: RequestContext,
    razorpayOrderId: string,
    attempts = 5,
    delayMs = 2000,
  ): Promise<Order | undefined> {
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
}
