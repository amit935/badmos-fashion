<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrders } from '../composables/useOrders';
import { usePriceFormatter } from '../composables/usePriceFormatter';
import OrderStatus from '../components/order/OrderStatus.vue';
import Pagination from '../components/ui/Pagination.vue';
const route = useRoute();
const router = useRouter();

const { isLoadingOrders, ordersError, fetchCustomerOrders } = useOrders();
const { formatPrice } = usePriceFormatter();

const orders = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = ref(5);

const totalPages = computed(() => 
  totalItems.value === 0 ? 1 : Math.ceil(totalItems.value / pageSize.value)
);

async function loadOrders(page = 1) {
  currentPage.value = page;
  const skip = (page - 1) * pageSize.value;
  
  const result = await fetchCustomerOrders(pageSize.value, skip);
  if (result?.success) {
    orders.value = result.orders;
    totalItems.value = result.totalItems;
  } else {
    orders.value = [];
    totalItems.value = 0;
  }
}

function handlePageChange(page) {
  loadOrders(page);
}

const updateQueryParams = (orderCode) => {
  router.push({
    name: 'OrderDetail',
    params: { code: orderCode },
  });
}

function countTotalItems(order) {
  return order.lines.reduce((total, line) => total + line.quantity, 0);
}

onMounted(() => {
  loadOrders(1);
});
</script>

<template>
  <div class="max-width py-10 px-6">
    <div class="mt-6">
      <h1 class="secondary-font text-center text-5xl">Your Orders</h1>
    </div>

    <div class="mt-6">
      <Spinner v-if="isLoadingOrders" size="lg" message="Loading your orders..." />
      <div v-else-if="ordersError">Error: {{ ordersError }}</div>

<div v-else>
  <div
    v-if="orders.length > 0"
    v-for="order in orders"
    :key="order.id"
    class="p-3"
  >
    <div class="flex justify-between border-2 border-black rounded-lg p-4 hover:shadow-md hover:bg-black/5 transition-all cursor-pointer group" @click="updateQueryParams(order.code)">
      <div class="space-y-2 flex-1">
        <p class="font-bold text-base group-hover:text-black">
          <span class="font-semibold text-black">Order ID - </span> 
          <span class="font-mono bg-black/10 px-2 py-1 rounded border border-black/20">#{{ order.code }}</span>
        </p>
        <p class="font-bold text-base group-hover:text-black">
          <span class="font-semibold text-black">Date - </span> 
          {{ new Date(order.orderPlacedAt).toLocaleDateString() }}
        </p>
        <p class="font-bold text-base group-hover:text-black">
          <span class="font-semibold text-black">Items - </span> 
          <span class="font-bold">{{ countTotalItems(order) }}</span>
        </p>
        <p class="font-bold text-base group-hover:text-black">
          <span class="font-semibold text-black">Value - </span> 
          <span class="font-bold">
            {{ formatPrice(order.totalWithTax) }}
          </span>
          <span class="text-xs text-gray-500"> (Incl. taxes)</span>
        </p>
      </div>
      <div class="flex-shrink-0 ml-4">
        <OrderStatus :state="order.state" />
      </div>
    </div>
  </div>

        <div v-else class="text-center text-gray-500 mt-4">
          No orders found.
        </div>

        <!-- Offloaded Pagination -->
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :loading="isLoadingOrders"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
