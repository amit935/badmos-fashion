import { Args, Query, Resolver } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger, RequestContextService, Payment, Order, TransactionalConnection, OrderService, PaymentService, RequestContext } from '@vendure/core';

@Resolver('RazorpayVerificationResult')
export class RazorpayShopResolver {
  private readonly loggerCtx = 'RazorpayShopResolver';

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private requestContextService: RequestContextService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private connection: TransactionalConnection,
  ) {}

  @Query(() => 'RazorpayVerificationResult')
  async verifyRazorpayOrder(@Args('razorpayOrderId') razorpayOrderId: string) {
    try {
      const result = await this.dataSource.query(`
        SELECT handler 
        FROM payment_method 
        WHERE code = 'razorpay-payment' 
        AND enabled = true 
        LIMIT 1
      `);

      if (!result[0]?.handler) {
        return { success: false, paid: false, error: 'Razorpay not configured' };
      }

      Logger.info(`RAW HANDLER: ${result[0].handler}`, this.loggerCtx);

      const ctx: RequestContext = await this.requestContextService.create({ apiType: 'admin' });
      const order = await this.findOrderByRazorpayOrderId(ctx, razorpayOrderId);

      const handler = JSON.parse(result[0].handler);
      const argsArray = handler.args || [];
      const keyIdArg = argsArray.find((arg: any) => arg.name === 'keyId');
      const keySecretArg = argsArray.find((arg: any) => arg.name === 'keySecret');
      
      const keyId = keyIdArg?.value;
      const keySecret = keySecretArg?.value;

      if (!keyId || !keySecret) {
        return { success: false, paid: false, error: 'Missing Razorpay credentials' };
      }

      const response = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
        }
      });

      const data = await response.json();
      Logger.info(`RAZORPAY RESPONSE: ${JSON.stringify(data, null, 2)}`, this.loggerCtx);

      if (data?.status === 'paid' && order) {
        const payment = await this.connection
          .getRepository(ctx, Payment)
          .createQueryBuilder('payment')
          .where('payment.orderId = :orderId', { orderId: order.id })
          .andWhere('payment.transactionId = :transactionId', { transactionId: razorpayOrderId })
          .getOne();

        if (payment && payment.state !== 'Settled') {
          Logger.info(`Found Vendure order: ${order.code} (needs settlement)`, this.loggerCtx);
          await this.paymentService.settlePayment(ctx, payment.id);
          Logger.info(`Payment ${payment.id} settled successfully`, this.loggerCtx);
        } else if (payment) {
          Logger.info(`Payment ${payment.id} already settled`, this.loggerCtx);
        }
      }

      return {
        success: true,
        paid: data.status === 'paid',
        paymentId: data.payments?.[0]?.id,
        razorpayOrderId: data.id,
        orderCode: order?.code,
        error: null
      };
    } catch (error: any) {
      Logger.error(`Razorpay verification failed: ${error.message}`, this.loggerCtx);
      return {
        success: false,
        paid: false,
        paymentId: null,
        razorpayOrderId: null,
        orderCode: null,
        error: error.message
      };
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
      Logger.error(`Error finding order by Razorpay order ID ${razorpayOrderId}: ${error}`, this.loggerCtx);
      return undefined;
    }
  }
}
