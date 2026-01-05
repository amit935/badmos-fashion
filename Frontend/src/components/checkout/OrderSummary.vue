<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeOrder: {
    type: Object,
    required: true
  },
  cartItems: {
    type: Array,
    required: true
  },
  formatPrice: {
    type: Function,
    required: true
  }
})

// Calculate total discounts from promotions only (checkout has discounts array)
const totalPromotionDiscounts = computed(() => {
  return props.activeOrder?.discounts?.reduce(
    (sum, d) => sum + (d.amount || 0),
    0
  ) || 0
})



// Calculate total taxes (excluding shipping taxes for checkout)
const totalTaxes = computed(() => {
  if (!props.activeOrder?.taxSummary) return 0
  return props.activeOrder.taxSummary
    .reduce((sum, t) => sum + (t.taxTotal || 0), 0)
})

// Applied promotions/coupons (checkout uses couponCodes)
const appliedPromotions = computed(() => {
  return props.activeOrder?.couponCodes || []
})

// Shipping GST display
const shippingGST = computed(() => {
  const shippingLine = props.activeOrder?.shippingLines?.[0]
  if (shippingLine?.taxLines?.length > 0) {
    const mainTax = shippingLine.taxLines[0]
    return mainTax?.taxRate > 0 ? `${mainTax.taxRate}%` : null
  }
  const shippingTax = props.activeOrder?.taxSummary?.find(t =>
    t?.description?.toLowerCase().includes('shipping')
  )
  return shippingTax?.taxRate > 0 ? `${shippingTax.taxRate}%` : null
})
</script>

<template>
  <div v-if="activeOrder?.code" class="border border-black rounded-lg overflow-hidden">
    <div v-if="cartItems?.length" class="border-b p-4">
      <div v-for="item in cartItems" :key="item.id" class="flex gap-2 mb-3">
        <div class="w-16 h-16 overflow-hidden rounded-md flex-shrink-0">
          <img 
            v-if="item.productVariant?.featuredAsset?.preview"
            :src="item.productVariant.featuredAsset.preview" 
            :alt="item.productVariant?.name || 'Product'" 
            class="w-full h-full object-cover" 
            loading="lazy"
          />
        </div>
        <div class="flex-1">
          <div class="font-bold text-sm">{{ item.productVariant?.name || 'Product' }}</div>
          <div class="text-gray-500 text-xs">Qty: {{ item.quantity }}</div>
          <div class="font-semibold text-sm">{{ formatPrice(item.linePriceWithTax || 0) }}</div>
        </div>
      </div>
    </div>
    
    <!-- Price Breakdown -->
    <div class="space-y-2 text-base p-4">
      <!-- Price (excl. tax) -->
      <div class="flex justify-between font-semibold">
        <span>Price (excl. tax):</span>
        <span>{{ formatPrice(activeOrder.subTotal - totalPromotionDiscounts || 0) }}</span>
      </div>

      <!-- Applied Promotions/Coupons -->
      <div v-if="appliedPromotions.length > 0" class="space-y-1">
        <div
          v-for="couponCode in appliedPromotions"
          :key="couponCode"
          class="flex justify-between font-medium text-sm text-black"
        >
          <span>Coupon: {{ couponCode }}</span>
          <span>{{ formatPrice(totalPromotionDiscounts) }}</span>
        </div>
      </div>

      <!-- Subtotal (after discounts) -->
      <div class="flex justify-between pt-2 border-t font-semibold">
        <span>Subtotal:</span>
        <span>{{ formatPrice(activeOrder.subTotal || 0) }}</span>
      </div>

      <!-- Shipping -->
      <div class="flex justify-between text-gray-500">
        <span>
          Shipping
          <span v-if="shippingGST" class="ml-1 text-xs">(Incl. GST @{{ shippingGST }})</span>
        </span>
        <span>{{ activeOrder.shippingWithTax > 0 ? formatPrice(activeOrder.shippingWithTax) : 'TBD' }}</span>
      </div>

      <!-- Tax Breakdown -->
      <div v-if="activeOrder.taxSummary?.length" class="border-t pt-2">
        <div class="flex justify-between font-medium mb-1">
          <span>Taxes:</span>
          <span>{{ formatPrice(totalTaxes) }}</span>
        </div>
        <div
          v-for="tax in activeOrder?.taxSummary"
          :key="tax?.description"
          class="flex justify-between text-sm text-gray-600 pl-4"
        >
          <span>{{ tax.description }} ({{ tax.taxRate }}%):</span>
          <span>{{ formatPrice(tax.taxTotal) }}</span>
        </div>
      </div>

      <!-- Final Total -->
      <div class="flex justify-between pt-3 border-t-2 text-lg font-bold">
        <span>Total:</span>
        <span>{{ formatPrice(activeOrder.totalWithTax || 0) }}</span>
      </div>
    </div>
  </div>
</template>
