<template>
  <div class="flex flex-col gap-6">
    <!-- Timeline Section -->
    <div>
      <div class="flex flex-row flex-wrap justify-center gap-4">
        <!-- Regular Steps -->
        <div 
          v-for="(step, index) in displaySteps" 
          :key="step.label"
          class="flex gap-3 items-start"
        >
          <div 
            class="w-10 h-10 rounded-full border border-black flex items-center justify-center font-bold flex-shrink-0 text-sm"
            :class="step.occurred ? 'bg-black text-white' : 'bg-white text-black'"
          >
            {{ index + 1 }}
          </div>
          <div class="flex-1 self-center">
            <p class="font-semibold text-sm">{{ step.label }}</p>
            <p v-if="step.details" class="text-xs text-gray-600">{{ step.details }}</p>
            <p v-if="step.occurred" class="text-xs text-gray-600">{{ step.date }}</p>
          </div>
        </div>

        <!-- Cancelled Step (OUTSIDE the loop) -->
        <div v-if="cancelledStep" class="flex gap-3 items-start">
          <div class="w-10 h-10 rounded-full bg-black border border-black flex items-center justify-center font-bold text-white flex-shrink-0 text-sm">
            {{ displaySteps.length + 1 }}
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm">{{ cancelledStep.label }}</p>
            <p class="text-xs text-gray-600">{{ cancelledStep.date }}</p>
          </div>
        </div>
      </div>
    </div>

   
  </div>
</template>


<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  historyItems: {
    type: Array,
    default: () => []
  }
})

const TIMELINE_STEPS = [
  { label: 'Processing', type: 'PROCESSING' },
  { label: 'On the way to ship', type: 'ON_WAY_TO_SHIP' },
  { label: 'Shipped', type: 'SHIPPED' },
  { label: 'Delivered', type: 'DELIVERED' }
]

const displaySteps = computed(() => {
  const history = props.historyItems || []
  const isCancelled = history.some(h => h.type === 'ORDER_STATE_TRANSITION' && h.data.to === 'Cancelled')
  
  const steps = []
  let lastOccurredIndex = -1

  TIMELINE_STEPS.forEach((stepDef, index) => {
    let step = {
      label: stepDef.label,
      occurred: false
    }

    if (stepDef.type === 'PROCESSING') {
      const event = history.find(h => h.type === 'ORDER_STATE_TRANSITION' && h.data.to === 'PaymentSettled')
      if (event) {
        step.occurred = true
        step.date = formatDate(event.createdAt)
        lastOccurredIndex = index
      }
    } else if (stepDef.type === 'ON_WAY_TO_SHIP') {
      const event = history.find(h => h.type === 'ORDER_FULFILLMENT')
      if (event) {
        step.occurred = true
        step.date = formatDate(event.createdAt)
        lastOccurredIndex = index
      }
    } else if (stepDef.type === 'SHIPPED') {
      const event = history.find(h => h.type === 'ORDER_FULFILLMENT_TRANSITION' && h.data.to === 'Shipped')
      if (event) {
        step.occurred = true
        step.date = formatDate(event.createdAt)
        lastOccurredIndex = index
      }
    } else if (stepDef.type === 'DELIVERED') {
      const event = history.find(h => h.type === 'ORDER_STATE_TRANSITION' && h.data.to === 'Delivered')
      if (event) {
        step.occurred = true
        step.date = formatDate(event.createdAt)
        lastOccurredIndex = index
      }
    }

    steps.push(step)
  })

  if (isCancelled) {
    return steps.slice(0, lastOccurredIndex + 1)
  }

  return steps
})

const cancelledStep = computed(() => {
  const history = props.historyItems || []
  const event = history.find(h => h.type === 'ORDER_CANCELLATION')
  
  if (event) {
    return {
      label: 'Cancelled',
      date: formatDate(event.createdAt),
      occurred: true
    }
  }
  return null
})


const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

