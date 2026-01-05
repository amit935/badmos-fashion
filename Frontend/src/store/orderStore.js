// stores/orderStore.js
import { ref } from 'vue'
import client from '../api/client'
import { 
  GET_ACTIVE_ORDER,
  GET_CUSTOMER_ADDRESSES,
  GET_ELIGIBLE_SHIPPING_METHODS,
  
  VERIFY_RAZORPAY_PAYMENT,
} from '../api/queries'
import { 
  APPLY_COUPON_CODE, 
  REMOVE_COUPON_CODE,
  SET_SHIPPING_ADDRESS,
  SET_BILLING_ADDRESS,
  SET_SHIPPING_METHOD,
  SAVE_CUSTOMER_ADDRESS,
  ADD_PAYMENT_TO_ORDER,
  TRANSITION_ORDER_TO_STATE,
  SETTLE_PAYMENT

} from '../api/mutations'

// Core reactive state
export const activeOrder = ref(null)
export const unsettledOrder = ref(null)
export const isLoadingOrder = ref(false)
export const orderError = ref(null)

// Core mutations
export function updateOrder(order) {
  activeOrder.value = order
}

export function clearOrder() {
  activeOrder.value = null
  orderError.value = null
}

// Generic GraphQL error handler
const handleGraphQLError = (err, context = '') => {
  const message = err.message || 'Unknown error occurred'
  console.error(`[${context}] GraphQL Error:`, err)
  orderError.value = message
  return { success: false, error: message }
}

// Generic success checker for Order mutations
const isOrderMutationSuccess = (data, mutationName) => {
  const result = data[mutationName]
  return result && result.__typename === 'Order' && result.id
}

// Generic mutation helper with auto-refetch and consistent loading
const performOrderMutation = async (mutationFn, context) => {
  isLoadingOrder.value = true
  orderError.value = null
  
  try {
    const result = await mutationFn()
    if (isOrderMutationSuccess(result, context.mutationName)) {
      // Auto-refresh order after successful mutation
      await fetchActiveOrder()
      return { success: true, order: activeOrder.value }
    }
    return {
      success: false,
      error: result[context.mutationName]?.message || 'Mutation failed without clear error'
    }
  } catch (err) {
    return handleGraphQLError(err, context.label)
  } finally {
    isLoadingOrder.value = false
  }
}

/**
 * Fetch active order
 */
export async function fetchActiveOrder() {
  try {
    isLoadingOrder.value = true
    orderError.value = null
    const data = await client.request(GET_ACTIVE_ORDER)
    activeOrder.value = data.activeOrder || null
    return { success: !!data.activeOrder, order: data.activeOrder }
  } catch (err) {
    return handleGraphQLError(err, 'fetchActiveOrder')
  } finally {
    isLoadingOrder.value = false
  }
}

/**
 * Apply coupon code
 */
export async function applyCoupon(couponCode) {
  if (!couponCode?.trim()) {
    return { success: false, error: 'Coupon code is required' }
  }
  return performOrderMutation(
    () => client.request(APPLY_COUPON_CODE, { couponCode: couponCode.trim() }),
    { mutationName: 'applyCouponCode', label: 'applyCoupon' }
  )
}

/**
 * Remove coupon code
 */
export async function removeCoupon(couponCode) {
  if (!couponCode?.trim()) {
    return { success: false, error: 'Coupon code is required' }
  }
  return performOrderMutation(
    () => client.request(REMOVE_COUPON_CODE, { couponCode: couponCode.trim() }),
    { mutationName: 'removeCouponCode', label: 'removeCoupon' }
  )
}

/**
 * Fetch customer saved addresses
 */
export async function fetchCustomerAddresses() {
  try {
    const data = await client.request(GET_CUSTOMER_ADDRESSES)
    const addresses = data.activeCustomer?.addresses || []
    return { success: true, addresses }
  } catch (err) {
    return handleGraphQLError(err, 'fetchCustomerAddresses')
  }
}

/**
 * Set shipping address
 */
export async function setShippingAddress(addressInput) {
  if (!addressInput) {
    return { success: false, error: 'Shipping address is required' }
  }
  return performOrderMutation(
    () => client.request(SET_SHIPPING_ADDRESS, { input: addressInput }),
    { mutationName: 'setOrderShippingAddress', label: 'setShippingAddress' }
  )
}

/**
 * Set billing address
 */
export async function setBillingAddress(addressInput) {
  if (!addressInput) {
    return { success: false, error: 'Billing address is required' }
  }
  return performOrderMutation(
    () => client.request(SET_BILLING_ADDRESS, { input: addressInput }),
    { mutationName: 'setOrderBillingAddress', label: 'setBillingAddress' }
  )
}

/**
 * Save customer address to account
 */
export async function saveCustomerAddress(addressInput) {
  if (!addressInput) {
    return { success: false, error: 'Address data is required' }
  }
  
  try {
    isLoadingOrder.value = true
    const response = await client.request(SAVE_CUSTOMER_ADDRESS, { input: addressInput })
    const result = response.createCustomerAddress

    if (result?.id) {
      isLoadingOrder.value = false
      return { success: true, address: result }
    }
    
    return { 
      success: false, 
      error: result?.message || 'Failed to save address to account' 
    }
  } catch (err) {
    isLoadingOrder.value = false
    return handleGraphQLError(err, 'saveCustomerAddress')
  }
}

/**
 * Fetch eligible shipping methods
 */
export async function fetchEligibleShippingMethods() {
  try {
    const data = await client.request(GET_ELIGIBLE_SHIPPING_METHODS)
    return { 
      success: true, 
      methods: data.eligibleShippingMethods || [] 
    }
  } catch (err) {
    return handleGraphQLError(err, 'fetchEligibleShippingMethods')
  }
}

/**
 * Set shipping method
 */
export async function setShippingMethod(shippingMethodId) {
  if (!shippingMethodId) {
    return { success: false, error: 'Shipping method ID is required' }
  }
  return performOrderMutation(
    () => client.request(SET_SHIPPING_METHOD, { shippingMethodId: [shippingMethodId] }),
    { mutationName: 'setOrderShippingMethod', label: 'setShippingMethod' }
  )
}

/**
 * Add payment to order
 */
export async function addPaymentToOrder(paymentInput) {
  if (!paymentInput) {
    return { success: false, error: 'Payment input is required' }
  }

  try {
    isLoadingOrder.value = true
    orderError.value = null
    const response = await client.request(ADD_PAYMENT_TO_ORDER, { input: paymentInput })
    const result = response.addPaymentToOrder

    if (result.__typename === 'Order') {
      updateOrder(result)
      isLoadingOrder.value = false
      return { success: true, order: result }
    }
    
    return { 
      success: false, 
      error: result?.message || result?.paymentErrorMessage || 'Failed to add payment',
      errorCode: result?.errorCode
    }
  } catch (err) {
    isLoadingOrder.value = false
    return handleGraphQLError(err, 'addPaymentToOrder')
  }
}

/**
 * Transition order to specific state
 */
export async function transitionOrderToState(state) {
  if (!state) {
    return { success: false, error: 'State is required' }
  }

  try {
    isLoadingOrder.value = true
    orderError.value = null
    const response = await client.request(TRANSITION_ORDER_TO_STATE, { state })
    const result = response.transitionOrderToState

    if (result.__typename === 'Order') {
      updateOrder(result)
      isLoadingOrder.value = false
      return { success: true, order: result }
    }
    
    return { 
      success: false, 
      error: result?.message || `Failed to transition to ${state}` 
    }
  } catch (err) {
    isLoadingOrder.value = false
    return handleGraphQLError(err, `transitionOrderToState-${state}`)
  }
}

export default {
  activeOrder,
  unsettledOrder,
  isLoadingOrder,
  orderError,
  updateOrder,
  clearOrder,
  fetchActiveOrder,
  applyCoupon,
  removeCoupon,
  fetchCustomerAddresses,
  setShippingAddress,
  setBillingAddress,
  saveCustomerAddress,
  fetchEligibleShippingMethods,
  setShippingMethod,
  addPaymentToOrder,
  transitionOrderToState,
}
