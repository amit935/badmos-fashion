<script setup>
import { computed } from 'vue';

const props = defineProps({
  width: {
    type: String,
    required: false,
    default: '196',
  },
  size: {
    type: String,
    required: false,
    default: '',
  }
});

const width = computed(() => {
  switch (props.size) {
    case 'small':
      return '98';
    case 'medium':
      return '148';
    case 'large':
      return '196';
    default:
      return props.width;
  }
});
</script>

<template>
  <img src="/src/assets/logo.svg" alt="Badmos Fashion" :width="width" />
</template>
