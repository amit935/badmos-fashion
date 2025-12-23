import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Ctx,
  RequestContext,
  OrderService,
  UserInputError,
  CustomerService,
  TransactionalConnection,
  HistoryService,
} from '@vendure/core';
import { CancellationRequestService } from '../services/cancellation-request.service';
import { CancellationRequest } from '../entities/cancellation-request.entity';
import { CancellationRequestPlugin } from '../cancellation-request.plugin';

@Resolver()
export class ShopCancellationRequestResolver {
  constructor(
    private readonly service: CancellationRequestService,
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
    private readonly connection: TransactionalConnection,
    private readonly historyService: HistoryService,
  ) {}

  @Query()
  async validateOrderCancellation(
    @Ctx() ctx: RequestContext,
    @Args('orderCode') orderCode: string,
  ): Promise<{ cancellable: boolean; reason: string | null }> {
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

    const customer = await this.customerService.findOneByUserId(
      ctx,
      ctx.activeUserId,
    );
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

    const earlyWindowHours =
      CancellationRequestPlugin.options?.earlyCancellationHours ?? 4;
    const postDeliveryWindowDays =
      CancellationRequestPlugin.options?.postDeliveryCancellationDays ?? 2;

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
      const earlyCutoffDate = new Date(
        orderCreatedAt.getTime() + earlyWindowMs,
      );

      if (now > earlyCutoffDate) {
        const createdDateStr = orderCreatedAt.toLocaleString();
        const cutoffDateStr = earlyCutoffDate.toLocaleString();
        return {
          cancellable: false,
          reason:
            `Early cancellation window expired. Orders can only be cancelled within ${earlyWindowHours} hours of placement. ` +
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
        reason:
          `Order cannot be cancelled while being processed or shipped. ` +
          `Current state: ${orderState}. ` +
          `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`,
      };
    }

    if (deliveredStates.includes(orderState)) {
      const history = await this.historyService.getHistoryForOrder(
        ctx,
        order.id,
        false,
        { take: 100 },
      );

      const deliveredEvent = history.items.find(
        h =>
          h.type === 'ORDER_STATE_TRANSITION' &&
          h.data &&
          (h.data.to === 'Delivered' || h.data.to === 'PartiallyDelivered'),
      );

      if (!deliveredEvent) {
        return {
          cancellable: false,
          reason: 'Cannot determine delivery date. Please contact support.',
        };
      }

      const deliveredAt = deliveredEvent.createdAt;
      const postDeliveryWindowMs =
        postDeliveryWindowDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(
        deliveredAt.getTime() + postDeliveryWindowMs,
      );

      if (now > cutoffDate) {
        const deliveryDateStr = deliveredAt.toLocaleDateString();
        const cutoffDateStr = cutoffDate.toLocaleDateString();
        return {
          cancellable: false,
          reason:
            `Cancellation window expired. Orders can only be cancelled within ${postDeliveryWindowDays} days after delivery. ` +
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

  @Mutation()
  async requestCancellation(
    @Ctx() ctx: RequestContext,
    @Args('orderCode') orderCode: string,
    @Args('orderLineId') orderLineId: string,
    @Args('quantity') quantity: number,
    @Args('reason') reason: string,
    @Args('requestType') requestType: string,
  ) {
    // Find the order
    const order = await this.orderService.findOneByCode(ctx, orderCode);
    if (!order) {
      throw new UserInputError(`Order with code ${orderCode} not found`);
    }

    // Get the current customer from the active user
    if (!ctx.activeUserId) {
      throw new UserInputError(
        'You must be logged in to request cancellation',
      );
    }

    const customer = await this.customerService.findOneByUserId(
      ctx,
      ctx.activeUserId,
    );
    if (!customer) {
      throw new UserInputError('No customer account found');
    }

    // Verify ownership
    if (!order.customer || order.customer.id !== customer.id) {
      throw new UserInputError(
        'You do not have permission to cancel this order',
      );
    }

    // ============ CANCELLATION WINDOW VALIDATION ============
    const orderState = order.state;

    const earlyWindowHours =
      CancellationRequestPlugin.options?.earlyCancellationHours ?? 4;
    const postDeliveryWindowDays =
      CancellationRequestPlugin.options?.postDeliveryCancellationDays ?? 2;

    const nonCancellableStates = ['Cancelled', 'Refunded'];
    if (nonCancellableStates.includes(orderState)) {
      throw new UserInputError(
        `Order cannot be cancelled. Current state: ${orderState}`,
      );
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
      const earlyCutoffDate = new Date(
        orderCreatedAt.getTime() + earlyWindowMs,
      );

      if (now > earlyCutoffDate) {
        const createdDateStr = orderCreatedAt.toLocaleString();
        const cutoffDateStr = earlyCutoffDate.toLocaleString();
        throw new UserInputError(
          `Early cancellation window expired. Orders can only be cancelled within ${earlyWindowHours} hours of placement. ` +
            `Order placed on: ${createdDateStr}, Deadline was: ${cutoffDateStr}. ` +
            `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`,
        );
      }
      // Within early window - allow cancellation
    } else if (processingStates.includes(orderState)) {
      throw new UserInputError(
        `Order cannot be cancelled while being processed or shipped. ` +
          `Current state: ${orderState}. ` +
          `Cancellation will be available again after delivery (within ${postDeliveryWindowDays} days).`,
      );
    } else if (deliveredStates.includes(orderState)) {
      const history = await this.historyService.getHistoryForOrder(
        ctx,
        order.id,
        false,
        { take: 100 },
      );

      const deliveredEvent = history.items.find(
        h =>
          h.type === 'ORDER_STATE_TRANSITION' &&
          h.data &&
          (h.data.to === 'Delivered' || h.data.to === 'PartiallyDelivered'),
      );

      if (!deliveredEvent) {
        throw new UserInputError(
          'Cannot determine delivery date. Please contact support.',
        );
      }

      const deliveredAt = deliveredEvent.createdAt;
      const postDeliveryWindowMs =
        postDeliveryWindowDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(
        deliveredAt.getTime() + postDeliveryWindowMs,
      );

      if (now > cutoffDate) {
        const deliveryDateStr = deliveredAt.toLocaleDateString();
        const cutoffDateStr = cutoffDate.toLocaleDateString();
        throw new UserInputError(
          `Cancellation window expired. Orders can only be cancelled within ${postDeliveryWindowDays} days after delivery. ` +
            `Delivered on: ${deliveryDateStr}, Deadline was: ${cutoffDateStr}`,
        );
      }
      // Within post-delivery window - allow cancellation
    } else {
      throw new UserInputError(
        `Order cannot be cancelled in current state: ${orderState}`,
      );
    }
    // ========================================================

    // Find the order line
    const line = order.lines.find(l => l.id === orderLineId);
    if (!line) {
      throw new UserInputError(
        `Order line ${orderLineId} not found in this order`,
      );
    }

    if (quantity <= 0) {
      throw new UserInputError('Quantity must be greater than 0');
    }

    // ✅ FIXED: Use service method with orderCode
    const existingRequests = await this.service.findByOrderCode(ctx, orderCode);

    const totalRequestedQuantity = existingRequests
      .filter(req => req.orderLineId === orderLineId && req.status === 'PENDING')
      .reduce((sum, req) => sum + req.requestedQuantity, 0);

    const remainingQuantity = line.quantity - totalRequestedQuantity;

    if (remainingQuantity <= 0) {
      throw new UserInputError(
        `All ${line.quantity} units of this item already have pending cancellation requests`,
      );
    }

    if (quantity > remainingQuantity) {
      throw new UserInputError(
        `Cannot request cancellation of ${quantity} units. ` +
          `Original quantity: ${line.quantity}, ` +
          `Already requested: ${totalRequestedQuantity}, ` +
          `Available for cancellation: ${remainingQuantity}`,
      );
    }

    if (quantity > line.quantity) {
      throw new UserInputError(
        `Cannot request cancellation of ${quantity} units. Order only contains ${line.quantity} units of this item`,
      );
    }

    // ✅ FIXED: Pass orderCode instead of orderId
    return this.service.create(ctx, {
      orderId: String(order.id),
      orderCode, // ✅ Now matches service input
      orderLineId,
      requestType: requestType as 'FULL' | 'PARTIAL',
      requestedQuantity: quantity,
      reason,
      requestedBy: customer.emailAddress,
    });
  }

  @Query()
async orderCancellationRequests(
  @Ctx() ctx: RequestContext,
  @Args('orderCode') orderCode: string,
): Promise<CancellationRequest[]> {
  return this.service.findByOrderCode(ctx, orderCode);
}

}
