<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../../composables/useCart'
import { usePriceFormatter } from '../../composables/usePriceFormatter'

import Button from '../ui/Button.vue'

const props = defineProps({
  toggleMenu: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['toggleMenu'])
const router = useRouter()

// USE THE COMPOSABLE - get everything from orderStore
const { 
  activeOrder,
  isLoading,
  error,
  cartItems,
  totalItems,
  isEmpty,
  total,
  fetchActiveOrder,
  incrementQuantity,
  decrementQuantity,
  removeFromCart
} = useCart()

const { formatPrice } = usePriceFormatter()

// Simplified functions - just call the composable methods
const handleIncrement = async (orderLineId, currentQuantity) => {
  await incrementQuantity(orderLineId, currentQuantity)
}

const handleDecrement = async (orderLineId, currentQuantity) => {
  await decrementQuantity(orderLineId, currentQuantity)
}

const handleRemove = async (orderLineId) => {
  await removeFromCart(orderLineId)
}

const goToRoute = (routeName, params = {}) => {
  emit('toggleMenu')
  router.push({ name: routeName, params })
}

onMounted(() => {
  fetchActiveOrder()
})
</script>

<template>
  <div class="flex flex-col h-full bg-white relative">
    <!-- Header -->
    <div class="relative z-20 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
      <h2 class="text-xl font-semibold">Shopping Cart ({{ totalItems }})</h2>
      <button 
        @click="emit('toggleMenu')" 
        class="p-1 text-gray-400 transition-colors"
        aria-label="Close cart"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Content wrapper -->
    <div class="relative flex-1 flex flex-col overflow-hidden">
      <!-- Loading State -->
      <Spinner v-if="isLoading || productsLoading" size="lg" message="Loading product details..." />

      <!-- Error State -->
      <div v-else-if="error" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-8 text-center bg-white">
        <p class="text-red-600">{{ error }}</p>
        <button 
          @click="fetchActiveOrder" 
          class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="isEmpty" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center bg-white">
        <span class="material-symbols-outlined text-gray-300 text-8xl">shopping_bag</span>
        <p class="text-lg text-gray-600">Your cart is empty</p>
        <button 
          @click="emit('toggleMenu')" 
          class="px-6 py-3 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </button>
      </div>

      <!-- Cart Items -->
      <template v-else>
        <!-- Items List -->
        <div class="flex-1 overflow-y-auto py-6 px-6 space-y-4">
          <div 
            v-for="item in cartItems" 
            :key="item.id" 
            class="flex gap-4 relative"
          >
            <!-- Product Image -->
            <div class="w-20 h-24 flex-shrink-0 overflow-hidden rounded-md">
              <img 
                :src="item.productVariant.featuredAsset?.preview || '/placeholder.png'" 
                :alt="item.productVariant.name"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Product Info -->
            <div class="flex-1 flex flex-col gap-1">
              <h3 class="text-sm font-semibold line-clamp-2 leading-tight pr-6">
                {{ item.productVariant.name }}
              </h3>
              <p class="text-sm font-medium mt-1">{{ formatPrice(item.unitPriceWithTax) }}</p>

              <div class="flex items-center justify-between gap-2 mt-2">
                <div class="flex items-center gap-2">
                  <button 
                    @click="handleDecrement(item.id, item.quantity)"
                    :disabled="isLoading"
                    class="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span class="text-sm font-semibold">-</span>
                  </button>
                  <span class="min-w-[30px] text-center text-sm font-medium">{{ item.quantity }}</span>
                  <button 
                    @click="handleIncrement(item.id, item.quantity)"
                    :disabled="isLoading"
                    class="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span class="text-sm font-semibold">+</span>
                  </button>
                </div>
          
                <button 
                  @click="handleRemove(item.id)"
                  :disabled="isLoading"
                  class="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Remove item"
                >
                  <span class="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Simple Total & Checkout -->
        <div class="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
          <!-- Total -->
          <div class="flex justify-between mb-4 text-lg font-bold">
            <span>Total:</span>
            <span>{{ formatPrice(total) }}</span>
          </div>

          <Button
            @click="goToRoute('checkout')"
            contentClasses="w-full uppercase"
            type="button"
            text="Proceed to Checkout"
          />

        </div>
      </template>
    </div>
  </div>
</template>
