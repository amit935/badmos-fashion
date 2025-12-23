<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  formatPrice: {
    type: Function,
    required: true
  }
})

// Payment method display names mapping
const paymentMethodNames = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  'dummy-payment-handler': 'Standard Payment',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  paypal: 'PayPal'
}

// Get display name for payment method
const getPaymentMethodName = (method) => {
  return paymentMethodNames[method?.toLowerCase()] || method || 'Unknown'
}

// Calculate total discounts from promotions only
const totalPromotionDiscounts = computed(() => {
  return props.order?.discounts?.reduce(
    (sum, d) => sum + (d.amountWithTax || 0),
    0
  ) || 0
})

// Calculate total surcharges (can be positive or negative)
const totalSurcharges = computed(() => {
  return props.order?.surcharges?.reduce(
    (sum, s) => sum + (s.priceWithTax || 0),
    0
  ) || 0
})

// Calculate total taxes
const totalTaxes = computed(() => {
  return props.order?.taxSummary?.reduce(
    (sum, t) => sum + (t.taxTotal || 0),
    0
  ) || 0
})

// Applied promotions/coupons
const appliedPromotions = computed(() => {
  return props.order?.promotions?.filter(p => p.couponCode) || []
})

// Surcharges with descriptions
const surchargeItems = computed(() => {
  return props.order?.surcharges || []
})

// Get payment metadata value safely
const getPaymentMetadata = (payment, key) => {
  if (!payment?.metadata) return null
  return payment.metadata[key] || payment.metadata?.public?.[key]
}
</script>

<template>
  <div v-if="order?.code" class="border border-black rounded-lg overflow-hidden ">
    <!-- Line Items -->
    <h2 class="text-xl font-bold p-4 border-b border-black">Order Summary</h2>
    <div v-if="order.lines?.length" class="border-b p-4">
      <div v-for="line in order.lines" :key="line.id" class="flex gap-2 mb-3">
        <div class="w-16 h-16 overflow-hidden rounded-md flex-shrink-0">
          <img 
            v-if="line.productVariant.featuredAsset?.preview"
            :src="line.productVariant.featuredAsset.preview" 
            :alt="line.productVariant.name" 
            class="w-full h-full object-cover" 
          />
        </div>
        <div class="flex-1">
          <div class="font-bold text-sm">{{ line.productVariant.name }}</div>
          <div class="text-gray-500 text-xs">Qty: {{ line.quantity }}</div>
          <div class="font-semibold text-sm">{{ formatPrice(line.discountedLinePriceWithTax) }}</div>
        </div>
      </div>
    </div>

    <!-- Price Breakdown -->
    <div class="space-y-2 text-base p-4">
      <!-- Price (excl. tax) -->
      <div class="flex justify-between font-semibold">
        <span>Price (excl. tax):</span>
        <span>{{ formatPrice(order.subTotal) }}</span>
      </div>

      <!-- Applied Promotions/Coupons -->
      <div v-if="appliedPromotions.length > 0" class="space-y-1">
        <div
          v-for="promo in appliedPromotions"
          :key="promo.id"
          class="flex justify-between font-medium text-sm"
        >
          <span>Promo: {{ promo.name }} {{ promo.couponCode ? `(${promo.couponCode})` : '' }}</span>
          <span>-{{ formatPrice(Math.abs(totalPromotionDiscounts)) }}</span>
        </div>
      </div>

      <!-- Manual Surcharges/Adjustments & Refunds -->
      <div v-if="surchargeItems.length > 0" class="space-y-1">
        <div
          v-for="surcharge in surchargeItems"
          :key="surcharge.sku || surcharge.description"
          class="flex justify-between text-sm"
          :class="surcharge.priceWithTax < 0 ? 'font-medium' : ''"
        >
          <span>
            {{ surcharge.priceWithTax < 0 ? '↩ Reverse Adjustment' : 'Adjustment' }}: {{ surcharge.description }}
          </span>
          <span>{{ formatPrice(surcharge.priceWithTax) }}</span>
        </div>
      </div>

      <!-- Subtotal (after discounts/adjustments) -->
      <div class="flex justify-between pt-2 border-t font-semibold">
        <span>Subtotal:</span>
        <span>{{ formatPrice(order.subTotal + totalPromotionDiscounts + totalSurcharges) }}</span>
      </div>

      <!-- Shipping -->
      <div class="flex justify-between">
        <span>Shipping:</span>
        <span>{{ formatPrice(order.shipping) }}</span>
      </div>

      <!-- Tax Breakdown -->
      <div v-if="order.taxSummary?.length" class="border-t pt-2">
        <div class="flex justify-between font-medium mb-1">
          <span>Taxes:</span>
          <span>{{ formatPrice(totalTaxes) }}</span>
        </div>
        <div
          v-for="tax in order.taxSummary"
          :key="tax.description"
          class="flex justify-between text-sm text-gray-600 pl-4"
        >
          <span>{{ tax.description }} ({{ tax.taxRate }}%):</span>
          <span>{{ formatPrice(tax.taxTotal) }}</span>
        </div>
      </div>

      <!-- Final Total -->
      <div class="flex justify-between pt-3 border-t-2 text-lg font-bold">
        <span>Total:</span>
        <span>{{ formatPrice(order.totalWithTax) }}</span>
      </div>

      <!-- Payment Information -->
      <div v-if="order.payments?.length" class="pt-2 border-t text-sm space-y-3">
        <div class="font-semibold">Payment Information:</div>
        <div
          v-for="payment in order.payments"
          :key="payment.id"
          class="border border-black p-3 rounded-md space-y-2"
        >
          <!-- Payment Method & Status -->
          <div class="flex justify-between items-center">
            <span class="font-medium">{{ getPaymentMethodName(payment.method) }}</span>
            <span 
              class="px-2 py-1 rounded text-xs font-semibold"
              :class="payment.state === 'Settled' 
                ? 'bg-black text-white' 
                : payment.state === 'Authorized'
                ? 'bg-black text-white'
                : 'bg-black text-white'"
            >
              {{ payment.state }}
            </span>
          </div>

          <!-- Amount -->
          <div class="flex justify-between text-xs text-gray-700">
            <span>Amount:</span>
            <span>{{ formatPrice(payment.amount) }}</span>
          </div>

          <!-- Payment ID (Transaction ID) -->
          <div v-if="payment.transactionId" class="flex justify-between text-xs text-gray-700">
            <span>Transaction ID:</span>
            <span class="font-mono text-xs">{{ payment.transactionId }}</span>
          </div>

          <!-- Payment Gateway ID (e.g., Razorpay Payment ID) -->
          <div v-if="getPaymentMetadata(payment, 'razorpayPaymentId')" class="flex justify-between text-xs text-gray-700">
            <span>Payment ID:</span>
            <span class="font-mono text-xs">{{ getPaymentMetadata(payment, 'razorpayPaymentId') }}</span>
          </div>

          <!-- Error Message (if any) -->
          <div v-if="payment.errorMessage" class="text-xs text-red-600 font-medium">
            Error: {{ payment.errorMessage }}
          </div>

          <!-- Refunds (if any) -->
          <div v-if="payment.refunds?.length" class="border-t border-gray-200 pt-2 mt-2">
            <div class="font-semibold text-xs mb-1">Refunds:</div>
            <div
              v-for="refund in payment.refunds"
              :key="refund.id"
              class="flex justify-between text-xs"
            >
              <span>{{ refund.reason }}</span>
              <span class="font-semibold">-{{ formatPrice(refund.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
