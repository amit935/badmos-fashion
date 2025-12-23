<script setup>
import { useRoute } from 'vue-router';
import Button from '../components/ui/Button.vue';

const route = useRoute();
const orderId = route.query.orderId || 'Unknown';
</script>

<template>
  <div class="min-h-screen flex flex-col items-center px-4 justify-center">
    <div class="flex flex-col md:flex-row gap-8 items-center max-w-4xl">
      <div class="w-50 flex-shrink-0">
        <img 
          src="../assets/badmos_eye_blink.gif" 
          alt="Thank You Badmos" 
          class="w-full h-full object-cover" 
        />
      </div>
      <div class="text-center md:text-left">
        <p class="text-4xl md:text-6xl lg:text-8xl secondary-font font-bold mb-4">
          You hold the cards, BADMOS!
        </p>
        <p class="text-lg text-gray-600">Order ID: <strong>{{ orderId }}</strong></p>
      </div>
    </div>

    <Button
      class="mt-8"
      text="check your orders"
      contentClasses="uppercase"
      @click="$router.push({ name: 'myorders' })" />
  </div>
</template>

