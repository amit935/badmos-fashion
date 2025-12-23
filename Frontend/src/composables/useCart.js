// composables/useCart.js
import { computed } from 'vue'
import client from '../api/client'
import { ADD_ITEM_TO_ORDER, ADJUST_ORDER_LINE, REMOVE_ORDER_LINE } from '../api/mutations'
import { GET_ACTIVE_ORDER } from '../api/queries'
import { activeOrder, isLoadingOrder, orderError, updateOrder } from '../store/orderStore'

export function useCart() {
  /**
   * Fetch the active order
   */
  async function fetchActiveOrder() {
    isLoadingOrder.value = true
    orderError.value = null
    
    try {
      const data = await client.request(GET_ACTIVE_ORDER)
      updateOrder(data.activeOrder)
      return {
        success: true,
        order: data.activeOrder
      }
    } catch (err) {
      orderError.value = err.message || 'Failed to load cart'
      console.error('Error fetching active order:', err)
      return {
        success: false,
        error: orderError.value
      }
    } finally {
      isLoadingOrder.value = false
    }
  }

  /**
   * Add item to cart
   */
  async function addToCart(productVariantId, quantity = 1) {
    isLoadingOrder.value = true
    orderError.value = null

    try {
      const data = await client.request(ADD_ITEM_TO_ORDER, {
        productVariantId,
        quantity
      })

      if (data.addItemToOrder.__typename === 'Order') {
        updateOrder(data.addItemToOrder)
        return {
          success: true,
          order: data.addItemToOrder,
          message: 'Item added to cart successfully'
        }
      } else if (data.addItemToOrder.__typename === 'InsufficientStockError') {
        orderError.value = `Only ${data.addItemToOrder.quantityAvailable} items available`
        if (data.addItemToOrder.order) {
          updateOrder(data.addItemToOrder.order)
        }
        return {
          success: false,
          error: orderError.value,
          quantityAvailable: data.addItemToOrder.quantityAvailable,
          order: data.addItemToOrder.order
        }
      } else if (data.addItemToOrder.errorCode) {
        orderError.value = data.addItemToOrder.message
        return {
          success: false,
          error: orderError.value,
          errorCode: data.addItemToOrder.errorCode
        }
      }
    } catch (err) {
      orderError.value = err.message || 'Failed to add item to cart'
      console.error('Add to cart error:', err)
      return {
        success: false,
        error: orderError.value
      }
    } finally {
      isLoadingOrder.value = false
    }
  }

  /**
   * Update quantity
   */
  async function updateQuantity(orderLineId, quantity) {
    isLoadingOrder.value = true
    orderError.value = null

    try {
      if (quantity <= 0) {
        return await removeFromCart(orderLineId)
      }

      const data = await client.request(ADJUST_ORDER_LINE, {
        orderLineId,
        quantity
      })

      if (data.adjustOrderLine.__typename === 'Order') {
        updateOrder(data.adjustOrderLine)
        return {
          success: true,
          order: data.adjustOrderLine,
          message: 'Cart updated successfully'
        }
      } else if (data.adjustOrderLine.__typename === 'InsufficientStockError') {
        orderError.value = `Only ${data.adjustOrderLine.quantityAvailable} items available`
        if (data.adjustOrderLine.order) {
          updateOrder(data.adjustOrderLine.order)
        }
        return {
          success: false,
          error: orderError.value,
          quantityAvailable: data.adjustOrderLine.quantityAvailable
        }
      } else if (data.adjustOrderLine.errorCode) {
        orderError.value = data.adjustOrderLine.message
        return {
          success: false,
          error: orderError.value,
          errorCode: data.adjustOrderLine.errorCode
        }
      }
    } catch (err) {
      orderError.value = err.message || 'Failed to update quantity'
      console.error('Update quantity error:', err)
      return {
        success: false,
        error: orderError.value
      }
    } finally {
      isLoadingOrder.value = false
    }
  }

  /**
   * Remove from cart
   */
  async function removeFromCart(orderLineId) {
    isLoadingOrder.value = true
    orderError.value = null

    try {
      const data = await client.request(REMOVE_ORDER_LINE, { orderLineId })

      if (data.removeOrderLine.__typename === 'Order') {
        updateOrder(data.removeOrderLine)
        return {
          success: true,
          order: data.removeOrderLine,
          message: 'Item removed from cart'
        }
      } else if (data.removeOrderLine.errorCode) {
        orderError.value = data.removeOrderLine.message
        return {
          success: false,
          error: orderError.value,
          errorCode: data.removeOrderLine.errorCode
        }
      }
    } catch (err) {
      orderError.value = err.message || 'Failed to remove item'
      console.error('Remove from cart error:', err)
      return {
        success: false,
        error: orderError.value
      }
    } finally {
      isLoadingOrder.value = false
    }
  }

  async function incrementQuantity(orderLineId, currentQuantity) {
    return await updateQuantity(orderLineId, currentQuantity + 1)
  }

  async function decrementQuantity(orderLineId, currentQuantity) {
    return await updateQuantity(orderLineId, currentQuantity - 1)
  }

  function clearError() {
    orderError.value = null
  }

  // Computed properties for convenience
  const cartItems = computed(() => activeOrder.value?.lines || [])
  const totalItems = computed(() => activeOrder.value?.totalQuantity || 0)
  const isEmpty = computed(() => cartItems.value.length === 0)
  const subtotal = computed(() => activeOrder.value?.subTotalWithTax || 0)
  const total = computed(() => activeOrder.value?.totalWithTax || 0)

  return {
    // State from store
    activeOrder,
    isLoading: isLoadingOrder,
    error: orderError,
    
    // Computed properties
    cartItems,
    totalItems,
    isEmpty,
    subtotal,
    total,
    
    // Methods
    fetchActiveOrder,
    addToCart,
    updateQuantity,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    clearError
  }
}
