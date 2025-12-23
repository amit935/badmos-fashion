<script setup>
import { computed } from 'vue';

const props = defineProps({
  state: {
    type: String,
    required: true,
  },
});

const statusClass = computed(
  () => statusColors[props.state] ?? 'bg-gray-400'
);
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black font-semibold text-white"
  >
    {{ state === 'PaymentSettled' ? 'Processing' : state }}
  </span>
</template>
