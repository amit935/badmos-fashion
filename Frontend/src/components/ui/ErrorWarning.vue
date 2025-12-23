<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'error',
    validator: val => ['error', 'warning', 'success'].includes(val)
  }
})

const containerClass = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 p-2 rounded'
    case 'success':
      return 'bg-green-100 text-green-800 p-2 rounded'
    default:
      return 'bg-red-100 text-red-800 p-2 rounded'
  }
})

const capitalizedType = computed(() => props.type.charAt(0).toUpperCase() + props.type.slice(1))
</script>

<template>
  <div v-if="message" :class="containerClass" role="alert" aria-live="assertive">
    <span class="font-bold uppercase mr-2">{{ capitalizedType }}:</span> {{ message }}
  </div>
</template>
