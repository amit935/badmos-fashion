<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import { usePriceFormatter } from '../composables/usePriceFormatter'
import { useAuthStore } from '../store/authStore'
import { useCountries } from '../composables/useCountries'
import { useRazorpay } from '../composables/useRazorpay'
import { useCheckout } from '../composables/useCheckout'

import AddressForm from '../components/checkout/AddressForm.vue'
import SavedAddressCard from '../components/checkout/SavedAddressCard.vue'
import OrderSummary from '../components/checkout/OrderSummary.vue'
import CouponCode from '../components/checkout/CouponCode.vue'
import CheckoutSteps from '../components/checkout/CheckoutSteps.vue'
import Button from '../components/ui/Button.vue'
import ErrorWarning from '../components/ui/ErrorWarning.vue'

// Core composables
const router = useRouter()
const { isAuthenticated } = useAuthStore()
const { countries } = useCountries()
const { openRazorpayCheckout, isProcessing: isPaymentProcessing, paymentError } = useRazorpay()
const { formatPrice } = usePriceFormatter()
const { cartItems, isEmpty } = useCart()

// Checkout composable (single source of truth)
const checkout = useCheckout()

// Destructure checkout state and methods
const {
  activeOrder,
  isLoading,
  error,
  currentStep,
  couponCode,
  couponError,
  savedAddresses,
  selectedSavedAddress,
  useSameForBilling,
  isSavingAddress,
  shippingAddress,
  billingAddress,
  eligibleShippingMethods,
  hasSavedAddresses,
  showShippingForm,
  isShippingFormValid,
  isBillingFormValid,
  canSaveAndContinue,
  saveAddressToAccount,
  fetchActiveOrder,
  loadSavedAddresses,
  refreshSavedAddresses,
  selectSavedAddress,
  useDifferentAddress,
  handleSaveAddress,
  handleApplyCoupon,
  handleRemoveCoupon,
  handleProceedToPayment,
} = checkout

// Computed properties for validation and UI
const appliedCoupons = computed(() => activeOrder.value?.couponCodes || [])

const hasValidShippingAddress = computed(() => {
  const addr = activeOrder.value?.shippingAddress
  return (
    addr &&
    addr.fullName?.trim() &&
    addr.streetLine1?.trim() &&
    addr.city?.trim() &&
    addr.postalCode?.trim()
  )
})

const hasValidBillingAddress = computed(() => {
  const addr = activeOrder.value?.billingAddress
  return (
    addr &&
    addr.fullName?.trim() &&
    addr.streetLine1?.trim() &&
    addr.city?.trim() &&
    addr.postalCode?.trim()
  )
})

const canProceedToOrderSummary = computed(() => 
  hasValidShippingAddress.value && hasValidBillingAddress.value
)

// Check if user is using a different/new address (not a saved one)
const isUsingDifferentAddress = computed(() => {
  return showShippingForm.value && !selectedSavedAddress.value
})

// UI synchronization
watch(useSameForBilling, (newVal) => {
  if (newVal) {
    billingAddress.value = { ...shippingAddress.value }
  }
})

watch(shippingAddress, (newVal) => {
  if (useSameForBilling.value) {
    billingAddress.value = { ...newVal }
  }
}, { deep: true })

// Auto-select existing address on mount or order change
const autoSelectExistingAddress = () => {
  if (!activeOrder.value?.shippingAddress || !savedAddresses.value.length) {
    return
  }

  const orderShippingAddr = activeOrder.value.shippingAddress
  const matchedAddress = savedAddresses.value.find(addr =>
    addr.streetLine1?.trim() === orderShippingAddr.streetLine1?.trim() &&
    addr.city?.trim() === orderShippingAddr.city?.trim() &&
    addr.postalCode?.trim() === orderShippingAddr.postalCode?.trim()
  )

  if (matchedAddress) {
    selectSavedAddress(matchedAddress.id)
  } else if (orderShippingAddr.streetLine1) {
    shippingAddress.value = {
      fullName: orderShippingAddr.fullName || '',
      streetLine1: orderShippingAddr.streetLine1 || '',
      streetLine2: orderShippingAddr.streetLine2 || '',
      city: orderShippingAddr.city || '',
      province: orderShippingAddr.province || '',
      postalCode: orderShippingAddr.postalCode || '',
      countryCode: orderShippingAddr.country?.code || 'IN',
      phoneNumber: orderShippingAddr.phoneNumber || ''
    }
    if (useSameForBilling.value) {
      billingAddress.value = { ...shippingAddress.value }
    }
  }
}

// Payment handler
const handleProceedToPaymentWrapper = async () => {
  const orderCode = activeOrder.value?.code
  await handleProceedToPayment(openRazorpayCheckout, {
    onSuccess: async () => {
      router.push({ name: 'order-success', query: { orderId: orderCode } })
    },
    onFailure: (error) => {
      console.error('Payment failed:', error)
    }
  })
}

// Lifecycle
onMounted(async () => {
  await fetchActiveOrder()
  await loadSavedAddresses()
  autoSelectExistingAddress()
  
  if (isEmpty.value) {
    router.push({ name: 'root' })
  }
})
</script>

<template>
  <div class="max-width px-4 md:px-24 py-12">
    <h1 class="text-6xl text-center secondary-font font-bold mb-8 uppercase">Checkout</h1>

    <!-- Loading state -->
    <div v-if="isLoading && !activeOrder" class="flex justify-center items-center h-64">
      <div class="spinner"></div>
      <span class="ml-4">Loading checkout...</span>
    </div>

    <!-- Empty cart -->
    <div v-else-if="isEmpty" class="text-center py-12">
      <p class="text-gray-600 mb-4">Your cart is empty</p>
      <Button
        @click="router.push({ name: 'root' })"
        contentClasses="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        text="Continue Shopping"
      />
    </div>

    <!-- Main checkout flow -->
    <div v-else>
      <CheckoutSteps
        :steps="['Shipping Details', 'Order Summary']"
        :current="currentStep"
        @step-change="step => { 
          if (step === 1 || (step === 2 && canProceedToOrderSummary)) {
            currentStep = step 
          }
        }"
      />

      <!-- Step 1: Shipping Details -->
      <section v-show="currentStep === 1" class="space-y-6">
        <!-- Saved Addresses -->
        <div v-if="isAuthenticated && hasSavedAddresses" class="bg-white p-6 rounded-lg border-2 border-black">
          <h2 class="text-xl font-semibold mb-4">Saved Addresses</h2>
          <div class="space-y-3">
            <SavedAddressCard
              v-for="address in savedAddresses"
              :key="address.id"
              :address="address"
              :selected="selectedSavedAddress === address.id"
              @select="selectSavedAddress"
            />
          </div>
          <button @click="useDifferentAddress" class="mt-4 text-sm text-gray-600 hover:underline">
            + Use a different address
          </button>
        </div>

        <!-- Shipping Form -->
        <div v-if="showShippingForm" class="bg-white p-6 rounded-lg border-2 border-black">
          <h2 class="text-xl font-semibold mb-4">Shipping Address</h2>
          <AddressForm 
            v-model="shippingAddress"
            :countries="countries"
            :showCountry="false"
            :showStates="true"
          />
        </div>

        <!-- Same as billing checkbox -->
        <div class="bg-white p-6 rounded-lg border-2 border-black">
          <label class="flex items-center cursor-pointer select-none">
            <input
              v-model="useSameForBilling"
              type="checkbox"
              class="w-5 h-5 mr-2 rounded border border-black bg-white appearance-none checked:bg-black checked:border-black relative"
            />
            <span class="text-sm font-medium">Use shipping address for billing</span>
          </label>
        </div>

        <!-- Billing Form -->
        <div v-if="!useSameForBilling" class="bg-white p-6 rounded-lg border-2 border-black">
          <h2 class="text-xl font-semibold mb-4">Billing Address</h2>
          <AddressForm 
            v-model="billingAddress"
            :countries="countries"
            :showCountry="true"
            :showStates="true"
          />
        </div>

        <!-- Save to account checkbox (only show if using different/new address) -->
        <div v-if="isUsingDifferentAddress && isAuthenticated" class="bg-white p-6 rounded-lg border-2 border-black">
          <label class="flex items-center cursor-pointer select-none">
            <input
              v-model="saveAddressToAccount"
              type="checkbox"
              class="w-5 h-5 mr-2 rounded border border-black bg-white appearance-none checked:bg-black checked:border-black relative"
            />
            <span class="text-sm font-medium">Save this address for future orders</span>
          </label>
        </div>

        <!-- Continue button -->
        <Button
          @click="handleSaveAddress"
          :disabled="isSavingAddress || !canSaveAndContinue"
          contentClasses="w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          :text="isSavingAddress ? 'Saving...' : 'Continue to Order Summary'"
        />

        <!-- Form validation message -->
        <p v-if="!canSaveAndContinue && showShippingForm" class="text-xs text-gray-500 text-center mt-2">
          Please fill all required fields to continue
        </p>

        <!-- General error -->
        <ErrorWarning v-if="error" class="mt-4" type="error" :message="error" />
      </section>

      <!-- Step 2: Order Summary -->
      <section v-show="currentStep === 2" class="space-y-6">
        <OrderSummary 
          :cartItems="cartItems"
          :formatPrice="formatPrice"
          :activeOrder="activeOrder"
        />

        <CouponCode
          :appliedCoupons="appliedCoupons"
          @apply="handleApplyCoupon"
          @remove="handleRemoveCoupon"
        >
          <template #error>
            <ErrorWarning v-if="couponError" class="mt-4" type="warning" :message="couponError" />
          </template>
        </CouponCode>

        <!-- Action buttons -->
        <div class="flex gap-4">
          <Button
            @click="() => { currentStep = 1 }"
            contentClasses="flex-1 uppercase"
            category="secondary"
          >
            Back to Shipping
          </Button>
          <Button
            @click="handleProceedToPaymentWrapper"
            :disabled="!hasValidShippingAddress || !hasValidBillingAddress || isPaymentProcessing"
            contentClasses="flex-1 uppercase"
            :loading="isPaymentProcessing"
          >
            {{ isPaymentProcessing ? 'Processing...' : 'Proceed to Payment' }}
          </Button>
        </div>

        <ErrorWarning v-if="paymentError" class="mt-2" :message="paymentError" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 50%;
  translate: -50%;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
