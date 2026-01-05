<script setup>
import { computed, onMounted, watch, ref } from 'vue'
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

const router = useRouter()
const { isAuthenticated } = useAuthStore()
const { countries } = useCountries()
const { 
  openRazorpayCheckout, 
  paymentError, 
  clearError
} = useRazorpay()
const { formatPrice } = usePriceFormatter()
const { cartItems, isEmpty } = useCart()

const checkout = useCheckout()

const {
  activeOrder,
  isLoading,
  cachedOrderForPayment,
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
  paymentVerificationError,
  isPaymentProcessing,
  fetchActiveOrder,
  loadSavedAddresses,
  selectSavedAddress,
  useDifferentAddress,
  handleSaveAddress,
  handleApplyCoupon,
  handleRemoveCoupon,
  handleProceedToPayment,
  isRazorpayPaymentVerifying,
} = checkout

const paymentInitiated = ref(false)

const appliedCoupons = computed(() => {
  if (currentStep.value === 3 && cachedOrderForPayment.value) {
    return cachedOrderForPayment.value.couponCodes || []
  }
  return activeOrder.value?.couponCodes || []
})

const hasValidShippingAddress = computed(() => {
  const order = currentStep.value === 3 && cachedOrderForPayment.value 
    ? cachedOrderForPayment.value 
    : activeOrder.value
  
  if (!order) return false
  const addr = order.shippingAddress
  return addr && addr.fullName?.trim() && addr.streetLine1?.trim() && addr.city?.trim() && addr.postalCode?.trim()
})

const hasValidBillingAddress = computed(() => {
  const order = currentStep.value === 3 && cachedOrderForPayment.value 
    ? cachedOrderForPayment.value 
    : activeOrder.value
  
  if (!order) return false
  const addr = order.billingAddress
  return addr && addr.fullName?.trim() && addr.streetLine1?.trim() && addr.city?.trim() && addr.postalCode?.trim()
})

const canProceedToOrderSummary = computed(() => hasValidShippingAddress.value && hasValidBillingAddress.value)

const isUsingDifferentAddress = computed(() => showShippingForm.value && !selectedSavedAddress.value)

const shouldShowEmptyCart = computed(() => {
  return isEmpty.value && !paymentError.value && !cachedOrderForPayment.value
})

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

const autoSelectExistingAddress = () => {
  if (!activeOrder.value?.shippingAddress || !savedAddresses.value.length) return

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

const handleProceedToPaymentWrapper = async () => {
  console.log("Starting payment flow...")
  await handleProceedToPayment(openRazorpayCheckout)
}

watch(currentStep, async (newStep) => {
  if (newStep === 3 && !paymentInitiated.value) {
    paymentInitiated.value = true
    console.log("Step 3 reached, initiating payment...")
    await handleProceedToPaymentWrapper()
  }
}, { immediate: false })

watch(() => currentStep.value, (newStep, oldStep) => {
  if (oldStep === 3 && newStep !== 3) {
    paymentInitiated.value = false
  }
})

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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
    <h1 class="text-5xl md:text-6xl text-center secondary-font font-bold mb-8 uppercase tracking-wider">Checkout</h1>

    <!-- Loading spinner -->
    <div v-if="isLoading && !activeOrder" class="flex justify-center items-center h-64">
      <Spinner size="lg" />
      <span class="ml-4 text-lg font-medium text-gray-700">Loading checkout...</span>
    </div>

    <!-- Empty cart -->
    <div v-else-if="shouldShowEmptyCart" class="text-center py-12 space-y-4">
      <p class="text-xl text-gray-600">Your cart is empty</p>
      <Button
        @click="router.push({ name: 'root' })"
        content-classes="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        text="Continue Shopping"
      />
    </div>

    <!-- Main checkout section -->
    <div v-else>
      <CheckoutSteps
        :steps="['Shipping Details', 'Order Summary', 'Payment']"
        :current="currentStep"
        @step-change="(step) => { 
          if (step === 1 || (step === 2 && canProceedToOrderSummary) || step === 3) {
            currentStep = step 
          }
        }"
      />

      <!-- Step 1: Shipping Address -->
      <section v-show="currentStep === 1" class="space-y-6">
        <div v-if="isAuthenticated && hasSavedAddresses" class="bg-white p-6 rounded-xl border-2 border-black shadow-lg">
          <h2 class="text-2xl font-semibold mb-6 uppercase tracking-wide">Saved Addresses</h2>
          <div class="space-y-3">
            <SavedAddressCard
              v-for="address in savedAddresses"
              :key="address.id"
              :address="address"
              :selected="selectedSavedAddress === address.id"
              @select="selectSavedAddress"
            />
          </div>
          <button @click="useDifferentAddress" class="mt-6 text-sm font-medium text-gray-600 hover:text-black hover:underline transition-colors">
            + Use a different address
          </button>
        </div>

        <div v-if="showShippingForm" class="bg-white p-6 rounded-xl border-2 border-black shadow-lg">
          <h2 class="text-2xl font-semibold mb-6 uppercase tracking-wide">Shipping Address</h2>
          <AddressForm 
            v-model="shippingAddress"
            :countries="countries"
            :show-country="false"
            :show-states="true"
          />
        </div>

        <div class="bg-white p-6 rounded-xl border-2 border-black shadow-lg">
          <label class="flex items-center cursor-pointer select-none group">
            <input
              v-model="useSameForBilling"
              type="checkbox"
              class="w-6 h-6 mr-3 rounded border-2 border-black bg-white appearance-none checked:bg-black checked:border-black relative transition-all duration-200 group-hover:border-gray-800"
            />
            <span class="text-lg font-medium text-gray-900">Use shipping address for billing</span>
          </label>
        </div>

        <div v-if="!useSameForBilling" class="bg-white p-6 rounded-xl border-2 border-black shadow-lg">
          <h2 class="text-2xl font-semibold mb-6 uppercase tracking-wide">Billing Address</h2>
          <AddressForm 
            v-model="billingAddress"
            :countries="countries"
            :show-country="true"
            :show-states="true"
          />
        </div>

        <div v-if="isUsingDifferentAddress && isAuthenticated" class="bg-white p-6 rounded-xl border-2 border-black shadow-lg">
          <label class="flex items-center cursor-pointer select-none group">
            <input
              v-model="saveAddressToAccount"
              type="checkbox"
              class="w-6 h-6 mr-3 rounded border-2 border-black bg-white appearance-none checked:bg-black checked:border-black relative transition-all duration-200 group-hover:border-gray-800"
            />
            <span class="text-lg font-medium text-gray-900">Save this address for future orders</span>
          </label>
        </div>

        <Button
          @click="handleSaveAddress"
          :disabled="isSavingAddress || !canSaveAndContinue"
          content-classes="w-full py-4 text-lg font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          text="Continue to Order Summary"
          :loading="isSavingAddress"
        />

        <p v-if="!canSaveAndContinue && showShippingForm" class="text-sm text-gray-500 text-center mt-4 font-medium">
          Please fill all required fields to continue
        </p>

        <ErrorWarning v-if="error" class="mt-6" type="error" :message="error" />
      </section>

      <!-- Step 2: Order Summary -->
      <section v-show="currentStep === 2" class="space-y-6">
        <OrderSummary 
          :cart-items="cartItems"
          :format-price="formatPrice"
          :active-order="activeOrder"
        />

        <CouponCode
          :applied-coupons="appliedCoupons"
          @apply="handleApplyCoupon"
          @remove="handleRemoveCoupon"
        >
          <template #error>
            <ErrorWarning v-if="couponError" class="mt-6" type="warning" :message="couponError" />
          </template>
        </CouponCode>
        
        <div class="flex flex-col sm:flex-row gap-4">
          <Button
            @click="currentStep = 1"
            content-classes="flex-1 py-4 text-lg font-bold uppercase tracking-wide"
            category="secondary"
          >
            Back to Shipping
          </Button>
          <Button
            @click="currentStep = 3"
            :disabled="!hasValidShippingAddress || !hasValidBillingAddress || isPaymentProcessing"
            content-classes="flex-1 py-4 text-lg font-bold uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :loading="isPaymentProcessing"
          >
            {{ isPaymentProcessing ? 'Processing...' : 'Proceed to Payment' }}
          </Button>
        </div>
      </section>

      <!-- Step 3: Payment Processing & Verification -->
      <section v-show="currentStep === 3" class="space-y-6">
        <div v-if="isPaymentProcessing" class="flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" message="Opening Razorpay..."/>
        </div>

        <div v-if="isRazorpayPaymentVerifying" class="flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" message="Verifying your payment..."/>
          <p class="text-sm text-gray-500">This may take a few moments. Please don't close this page.</p>
        </div>

        <ErrorWarning 
          v-else-if="paymentError" 
          class="mt-4" 
          type="error" 
          :message="paymentError"
          @close="clearError"
        />

        <ErrorWarning 
          v-else-if="paymentVerificationError" 
          class="mt-4" 
          type="error" 
          :message="paymentVerificationError"
        />
      </section>
    </div>
  </div>
</template>
