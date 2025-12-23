<script setup>
import { computed } from 'vue';
import Button from '../ui/Button.vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  onPageChange: {
    type: Function,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const hasPrevious = computed(() => props.currentPage > 1);
const hasNext = computed(() => props.currentPage < props.totalPages);
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
    <Button
      class=" !p-3 disabled:opacity-50"
      override-class="p-1"
      :disabled="!hasPrevious || loading"
      @click="onPageChange(currentPage - 1)"
    >
      Previous
    </Button>

    <span class="text-base font-medium">
      Page {{ currentPage }} of {{ totalPages }}
    </span>

    <Button
      class="!p-3 disabled:opacity-50"
      :disabled="!hasNext || loading"
      @click="onPageChange(currentPage + 1)"
    >
      Next
    </Button>
  </div>
</template>
