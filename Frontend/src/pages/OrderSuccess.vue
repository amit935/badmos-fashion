<script setup>
import { ref, onMounted } from 'vue' 
import { useRouter, useRoute } from 'vue-router';
import { useQueryCollection } from '../composables/useQueryCollection'
import Button from '../components/ui/Button.vue';

const router = useRouter();
const route = useRoute();
const orderInstructions = ref({});
const { fetchCollection, isLoading, error } = useQueryCollection();
const orderId = route.query.orderId || 'Unknown';

onMounted(async () => { 
  try {
    const result = await fetchCollection('order-instructions');
    orderInstructions.value = result;
  } catch (err) {
    console.error('Fetch error:', err);
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center py-12 px-6 justify-center">
    <div class="flex flex-col md:flex-row gap-8 items-center max-w-4xl">
      <div class="w-50 flex-shrink-0">
        <img 
          src="../assets/badmos_eye_blink.gif" 
          alt="Thank You Badmos" 
          class="w-full h-full object-cover" 
        />
      </div>
      <div class="text-center md:text-left">
        <p class="text-5xl md:text-6xl lg:text-8xl secondary-font font-bold mb-4">
          You hold the cards, BADMOS!
        </p>
        <p class="text-lg text-gray-600">Order ID: <strong>{{ orderId }}</strong></p>
      </div>
    </div>

    <Button
      class="mt-8"
      text="check your orders"
      contentClasses="uppercase"
      @click="router.push({ name: 'myorders' })" 
    />
      <div class="text-sm mt-10">
      <h2 class="text-center text-4xl font-bold secondary-font mb-4">{{ orderInstructions?.name }}</h2>
      <div class="rich-text prose prose-lg max-w-none mx-auto leading-relaxed text-gray-700" v-html="orderInstructions?.description"></div>
  </div>
  </div>

</template>

<style scoped>
.rich-text :deep(p) {
  margin: 0 0 1rem 0;
  line-height: 1.625;
}
.rich-text :deep(p:last-child) {
  margin-bottom: 0;
}
.rich-text :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}
.rich-text :deep(li) {
  margin-bottom: 0.5rem;
}
.rich-text :deep(br) {
  line-height: 1.625;
}
</style>
