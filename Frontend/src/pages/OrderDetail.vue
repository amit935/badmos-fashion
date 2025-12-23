<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useOrders } from '../composables/useOrders';
import { usePriceFormatter } from '../composables/usePriceFormatter';
import OrderDetailSummary from '../components/order/OrderDetailSummary.vue';
import ErrorWarning from '../components/ui/ErrorWarning.vue';
import CancellationTimeline from '../components/order/CancellationTimeline.vue';
import OrderTimeline from '../components/order/OrderHistoryTimeline.vue';
import SupportCommunication from '../components/order/SupportCommunication.vue';

const route = useRoute();
const {
  isLoadingOrders,
  ordersError,
  fetchOrderByCode,
  requestCancellation,
  validateOrderCancellation,
  fetchOrderCancellationHistory,  
} = useOrders();
const { formatPrice } = usePriceFormatter();

const order = ref(null);
const cancellationRequests = ref([]);

const isOrderCancellable = ref(false);
const cancellationReason = ref(null);
const cancellationError = ref(null);

const showCancelModal = ref(false);
const selectedLine = ref(null);
const cancelQuantity = ref(1);
const cancelReason = ref('Customer requested cancellation');

const maxQuantity = computed(() => selectedLine.value?.quantity ?? 1);

const cancellationRequestsForLine = (lineId) => {
  return cancellationRequests.value.filter(req => req.orderLineId === lineId);
};

onMounted(async () => {
  const result = await fetchOrderByCode(route.params.code);
  if (result?.success && result.order) {
    order.value = result.order;

    const requestsResult = await fetchOrderCancellationHistory(order.value.code);
    if (requestsResult?.success) {
      cancellationRequests.value = requestsResult.cancellationRequests || [];
    }

    const validation = await validateOrderCancellation(order.value.code);
    if (validation?.success && validation.result) {
      isOrderCancellable.value = validation.result.cancellable;
      cancellationReason.value = validation.result.reason ?? null;
    } else {
      isOrderCancellable.value = false;
      cancellationReason.value = validation?.error || null;
    }
  } else {
    order.value = null;
  }
});

function openCancelModal(line) {
  if (!isOrderCancellable.value) return;
  selectedLine.value = line;
  cancelQuantity.value = 1;
  cancelReason.value = 'Customer requested cancellation';
  cancellationError.value = null;
  showCancelModal.value = true;
}

function closeCancelModal() {
  showCancelModal.value = false;
  selectedLine.value = null;
  cancelQuantity.value = 1;
  cancelReason.value = 'Customer requested cancellation';
}

function incrementQuantity() {
  if (cancelQuantity.value < maxQuantity.value) {
    cancelQuantity.value++;
  }
}

function decrementQuantity() {
  if (cancelQuantity.value > 1) {
    cancelQuantity.value--;
  }
}

async function confirmCancellation() {
  if (!order.value || !selectedLine.value) return;

  const res = await requestCancellation({
    orderCode: order.value.code,
    orderLineId: selectedLine.value.id,
    quantity: cancelQuantity.value,
    reason: cancelReason.value,
    requestType: 'LINE_ITEM_CANCEL',
  });

  closeCancelModal();

  if (!res.success) {
    cancellationError.value = res.error || 'Failed to submit cancellation request';
  }
}
</script>

<template>
  <div class="max-width py-8 px-4 sm:px-6">
    <!-- Header -->
    <div class="mt-6 text-center">
      <h1 class="secondary-font break-words text-3xl sm:text-4xl md:text-5xl font-bold">
        {{ order?.code }}
      </h1>
    </div>

    <!-- Main Content -->
    <div class="mt-8 space-y-8" v-if="order">
      <!-- Order Timeline - FULL WIDTH -->
      <OrderTimeline :history-items="order?.history.items" />

      <!-- 2 Column Layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column -->
        <div class="md:col-span-2 space-y-6">
          <!-- Support Communication -->
          <SupportCommunication :history-items="order?.history.items" />

          <!-- Tracking Details -->
          <div v-if="order?.fulfillments.length > 0" class="border border-black rounded-lg overflow-hidden">
            <h2 class="text-xl font-bold p-4 border-b border-black">Tracking</h2>
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="fulfillment in order.fulfillments" 
                :key="fulfillment.id" 
                class="border border-black rounded p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <span class="font-bold text-sm truncate">{{ fulfillment.method || 'N/A' }}</span>
                  <div v-if="fulfillment.trackingCode" class="text-xs bg-black text-white px-2 py-1 rounded font-mono">
                    #{{ fulfillment.trackingCode.slice(-8) }}
                  </div>
                </div>
                <div class="space-y-1 text-xs">
                  <div v-for="line in fulfillment.lines.slice(0, 2)" :key="line.id" class="flex items-center gap-2 truncate">
                    <span class="truncate">{{ line.orderLine.productVariant.name }}</span>
                    <span>×{{ line.orderLine.quantity }}</span>
                  </div>
                  <span v-if="fulfillment.lines.length > 2" class="text-gray-500">+{{ fulfillment.lines.length - 2 }} more</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items List -->
         <!-- Items List -->
<div class="border border-black rounded-lg overflow-hidden">
  <h2 class="text-xl font-bold p-4 border-b border-black">Items</h2>
  <div class="divide-y divide-black/20">
    <div
      v-for="line in order.lines"
      :key="line.id"
      class="transition-colors"
    >
      <!-- Main row -->
      <div class="p-4 flex items-center gap-3">
        <!-- Image -->
        <div v-if="line.productVariant.featuredAsset" class="w-12 h-12 flex-shrink-0">
          <img
            :src="line.productVariant.featuredAsset.preview"
            :alt="line.productVariant.name"
            class="w-full h-full object-cover rounded border border-black"
          />
        </div>
        
        <!-- Item details -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm truncate">{{ line.productVariant.name }}</p>
          <p class="text-xs text-gray-600">Qty: {{ line.quantity }}</p>
          <p class="text-sm font-bold">{{ formatPrice(line.linePriceWithTax) }}</p>
        </div>
        
        <!-- Cancel button - aligned with item name on desktop -->
        <button
          type="button"
          :disabled="!isOrderCancellable"
          class="ml-auto px-3 py-1 text-xs border font-semibold rounded whitespace-nowrap transition-all flex-shrink-0"
          :class="
            isOrderCancellable
              ? 'border-black text-black hover:bg-black hover:text-white'
              : 'border-gray-300 text-gray-400 cursor-not-allowed'
          "
          @click="openCancelModal(line)"
        >
          Cancel
        </button>
      </div>

      <!-- Per-item cancellation error & timeline (below main row) -->
      <div v-if="cancellationError || cancellationRequestsForLine(line.id).length" class="pt-2 px-4 pb-4 border-t border-black/20">
        <ErrorWarning
          v-if="cancellationError"
          :message="cancellationError"
          type="error"
          class="mb-2"
        />
        <CancellationTimeline 
          v-if="cancellationRequestsForLine(line.id).length" 
          :cancellation-requests="cancellationRequestsForLine(line.id)" 
        />
      </div>
    </div>
  </div>
</div>

        </div>

        <!-- Right Column - Order Summary -->
        <div class="md:col-span-1">
          <div class="sticky top-4">
            <OrderDetailSummary :order="order" :formatPrice="formatPrice" />
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div class="bg-white border-2 border-black rounded-xl shadow-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4 border-b border-black pb-2">Cancel Item</h3>

        <div class="space-y-4">
          <div>
            <p class="font-semibold text-sm mb-1">Item</p>
            <p class="text-sm truncate">{{ selectedLine?.productVariant.name }}</p>
            <p class="text-xs text-gray-600">Ordered: {{ selectedLine?.quantity }}</p>
          </div>

          <!-- Quantity selector -->
          <div class="flex items-center justify-between">
            <span class="font-semibold text-sm">Cancel:</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="w-8 h-8 border border-black rounded font-bold hover:bg-black hover:text-white transition"
                :disabled="cancelQuantity === 1"
                @click="decrementQuantity"
              >
                -
              </button>
              <span class="w-10 text-center font-bold text-lg">{{ cancelQuantity }}</span>
              <button
                type="button"
                class="w-8 h-8 border border-black rounded font-bold hover:bg-black hover:text-white transition"
                :disabled="cancelQuantity === maxQuantity"
                @click="incrementQuantity"
              >
                +
              </button>
            </div>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-semibold mb-2">Reason <span class="text-red-600">*</span></label>
            <textarea
              v-model="cancelReason"
              rows="3"
              class="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:border-black/50 resize-vertical text-sm"
              placeholder="Explain why you want to cancel..."
              required
            ></textarea>
          </div>

          <ErrorWarning
            v-if="cancellationError"
            :message="cancellationError"
            type="error"
            class="mb-4"
          />

          <div class="flex gap-3 pt-4 border-t border-black">
            <button
              type="button"
              class="flex-1 py-2.5 border-2 border-black text-black font-bold rounded-lg hover:bg-black hover:text-white transition"
              @click="closeCancelModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              :disabled="!cancelReason.trim()"
              @click="confirmCancellation"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m7-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 4h4a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"></path>
              </svg>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
