<script setup>
const props = defineProps({ steps: Array, current: Number })
const emit = defineEmits(['step-change'])
</script>

<template>
  <div class="max-width flex justify-center space-x-6 mb-6 select-none scale-[0.8] md:scale-[1]">
    <div
      v-for="(step, idx) in steps"
      :key="idx"
      class="flex items-center cursor-pointer space-x-2"
      :class="idx + 1 === current ? 'font-bold text-black' : 'text-black'"
    >
      <span
        class="flex items-center justify-center w-10 h-10 rounded-full font-semibold select-none"
        :class="idx + 1 === current ? 'bg-black text-white' : 'bg-transparent border-1 border-black text-black'"
      >
        {{ idx + 1 }}
      </span>
      <span class="whitespace-nowrap">{{ step }}</span>
    </div>
  </div>
</template>
