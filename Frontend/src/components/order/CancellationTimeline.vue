<template>
  <div class="cancellation-timeline mt-6 border border-black rounded-lg">
    <!-- Header -->
    <div 
      class="header flex items-center justify-between p-3 cursor-pointer transition-all border-b border-black"
      @click="isExpanded = !isExpanded"
      :class="{ 'rounded-b-lg': !isExpanded }"
    >
      <div class="flex items-center gap-2">
        <h4 class="font-bold text-sm">
          Cancellation History ({{ props.cancellationRequests.length }})
        </h4>
        <svg 
          class="w-4 h-4 transition-transform duration-200" 
          :class="{ 'rotate-180': isExpanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="content p-3 bg-white rounded-b-lg">
      <div v-if="timelineEntries.length === 0" class="text-sm text-gray-500 italic py-3 text-center">
        No cancellation requests
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="(entry, index) in timelineEntries"
          :key="entry.id"
          class="timeline-item flex items-start gap-2 p-2 rounded border border-black relative"
        >
          <!-- Dot -->
          <div
            class="flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full"
            :class="getDotClasses(entry.status)"
          />
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Request + Status -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <span class="text-xs font-semibold truncate">{{ entry.requestText }}</span>
              <span
                class="px-1.5 py-0.5 text-xs font-bold rounded whitespace-nowrap"
                :class="getBadgeClasses(entry.status)"
              >
                {{ entry.status }}
              </span>
            </div>
            
            <!-- ID + Date -->
            <div class="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <span class="font-mono">#{{ entry.id.slice(-6) }}</span>
              <span>{{ formatDate(entry.createdAt) }}</span>
            </div>
            
            <!-- Reason (truncated) -->
            <p v-if="entry.reason" class="text-xs text-gray-700 line-clamp-1 mb-1">
              {{ entry.reason }}
            </p>
            
            <!-- Admin note -->
            <div v-if="entry.adminNote" class="text-xs p-1.5 rounded border border-black/20">
              <span class="font-semibold">Support:</span> {{ entry.adminNote }}
            </div>
          </div>
          
          <!-- Connector -->
          <div
            v-if="index < timelineEntries.length - 1"
            class="absolute left-1 top-7 w-px h-4 bg-black/30"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  cancellationRequests: {
    type: Array,
    default: () => []
  }
})

const isExpanded = ref(false)

const timelineEntries = computed(() => {
  return props.cancellationRequests
    .map(req => ({
      id: req.id,
      requestText: `Cancel ${req.requestedQuantity}`,
      status: req.status,
      reason: req.reason,
      adminNote: req.adminNote,
      createdAt: req.createdAt
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getDotClasses = (status) => {
  return {
    APPROVED: 'bg-black',
    REJECTED: 'bg-gray-400',
    PENDING: 'bg-black/50'
  }[status] || 'bg-black/30'
}

const getBadgeClasses = (status) => {
  return {
    APPROVED: 'bg-black text-white',
    REJECTED: 'bg-gray-400 text-white',
    PENDING: 'bg-black/50 text-white'
  }[status] || 'bg-black/30 text-white'
}
</script>
