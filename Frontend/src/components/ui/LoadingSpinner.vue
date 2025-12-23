<!-- components/ui/Spinner.vue -->
<template>
  <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
    <div 
      class="spinner"
      :class="[
        size === 'sm' && 'w-8 h-8 border-2',
        size === 'md' && 'w-10 h-10 border-3', 
        size === 'lg' && 'w-12 h-12 border-4'
      ]"
    ></div>
    <p v-if="message" class="text-gray-600 text-sm font-medium text-center">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md' },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
