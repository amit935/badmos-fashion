import { ref } from 'vue';
import client from '../api/client';
import {
  GET_ACTIVE_CUSTOMER_ORDERS,
  GET_ORDER_BY_CODE,
  VALIDATE_ORDER_CANCELLATION,
  ORDER_CANCELLATION_HISTORY,
} from '../api/queries';
import { REQUEST_CANCELLATION } from '../api/mutations';

function extractGraphQLErrorMessage(err, fallback) {
  const gqErrors = err?.response?.errors;
  if (Array.isArray(gqErrors) && gqErrors.length > 0 && gqErrors[0].message) {
    return gqErrors[0].message;
  }
  return err?.message || fallback;
}

export function useOrders() {
  const isLoadingOrders = ref(false);
  const ordersError = ref(null);

 async function fetchCustomerOrders(take = 5, skip = 0) {
  isLoadingOrders.value = true;
  ordersError.value = null;

  try {
    const data = await client.request(GET_ACTIVE_CUSTOMER_ORDERS, {
      take,
      skip
    });

    if (data?.activeCustomer?.orders) {
      return {
        success: true,
        orders: data.activeCustomer.orders.items,
        totalItems: data.activeCustomer.orders.totalItems,
        hasMore: data.activeCustomer.orders.items.length === take
      };
    }

    return {
      success: false,
      error: 'No customer data found',
    };
  } catch (err) {
    const message = extractGraphQLErrorMessage(err, 'Failed to load orders');
    ordersError.value = message;
    return {
      success: false,
      error: message,
    };
  } finally {
    isLoadingOrders.value = false;
  }
}


  async function fetchOrderByCode(orderCode) {
    isLoadingOrders.value = true;
    ordersError.value = null;

    try {
      const data = await client.request(GET_ORDER_BY_CODE, { code: orderCode });
      if (data?.orderByCode) {
        return {
          success: true,
          order: data.orderByCode,
        };
      }
      return {
        success: false,
        error: 'Order not found',
      };
    } catch (err) {
      const message = extractGraphQLErrorMessage(err, 'Failed to load order');
      ordersError.value = message;
      return {
        success: false,
        error: message,
      };
    } finally {
      isLoadingOrders.value = false;
    }
  }

  async function validateOrderCancellation(orderCode) {
    isLoadingOrders.value = true;
    ordersError.value = null;

    try {
      const data = await client.request(VALIDATE_ORDER_CANCELLATION, {
        code: orderCode, // ($code: String!)
      });

      if (data?.validateOrderCancellation) {
        return {
          success: true,
          result: {
            cancellable: data.validateOrderCancellation.cancellable,
            reason: data.validateOrderCancellation.reason ?? null,
          },
        };
      }

      return {
        success: false,
        error: 'Validation did not return a result',
      };
    } catch (err) {
      const message = extractGraphQLErrorMessage(
        err,
        'Failed to validate cancellation',
      );
      ordersError.value = message;
      return {
        success: false,
        error: message,
      };
    } finally {
      isLoadingOrders.value = false;
    }
  }

  async function requestCancellation({
    orderCode,
    orderLineId,
    quantity,
    reason,
    requestType,
  }) {
    isLoadingOrders.value = true;
    ordersError.value = null;

    try {
      const data = await client.request(REQUEST_CANCELLATION, {
        orderCode,
        orderLineId,
        quantity,
        reason,
        requestType,
      });

      if (data?.requestCancellation) {
        return {
          success: true,
          cancellation: data.requestCancellation,
        };
      }

      return {
        success: false,
        error: 'Failed to submit cancellation request',
      };
    } catch (err) {
      const message = extractGraphQLErrorMessage(
        err,
        'Failed to submit cancellation request',
      );
      ordersError.value = message;
      return {
        success: false,
        error: message,
      };
    } finally {
      isLoadingOrders.value = false;
    }
  }

  async function fetchOrderCancellationHistory(orderCode) {
    isLoadingOrders.value = true;
    ordersError.value = null;

    try {
      const data = await client.request(ORDER_CANCELLATION_HISTORY, {
        orderCode,
      });

      if (data?.orderCancellationRequests) {
        return {
          success: true,
          cancellationRequests: data.orderCancellationRequests,
        };
      }

      return {
        success: false,
        error: 'No cancellation history found',
      };
    } catch (err) {
      const message = extractGraphQLErrorMessage(
        err,
        'Failed to load cancellation history',
      );
      ordersError.value = message;
      return {
        success: false,
        error: message,
      };
    } finally {
      isLoadingOrders.value = false;
    }
  }

  return {
    isLoadingOrders,
    ordersError,

    fetchCustomerOrders,
    fetchOrderByCode,
    validateOrderCancellation,
    requestCancellation,
    fetchOrderCancellationHistory,
  };
}
