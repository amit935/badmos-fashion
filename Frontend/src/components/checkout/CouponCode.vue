<script setup>
import { ref } from 'vue'
import FormInputField from './FormInputField.vue' // adjust path as needed
import Button from '../ui/Button.vue'

const props = defineProps({ appliedCoupons: Array })
const emit = defineEmits(['apply', 'remove'])
const code = ref('')

function apply() {
  if (code.value.trim()) {
    emit('apply', code.value.trim())
    code.value = ''
  }
}
</script>

<template>
  <div>
    <div v-if="appliedCoupons.length" class="mb-4 flex flex-wrap gap-2">
      <span
        v-for="code in appliedCoupons"
        :key="code"
        class="px-3 py-3 rounded bg-black text-white font-bold flex items-center gap-2"
      >
        <span class="material-symbols-outlined">
percent
</span>
        {{ code }}
        
        <Button
          type="button"
          @click="$emit('remove', code)"
          class="!p-1 text-sm font-semibold hover:!text-white hover:!bg-transparent"
          aria-label="Remove coupon code"
        >
        <span class="material-symbols-outlined">
close
</span>
        </Button>
      </span>
    </div>
    <div class="md:max-w-1/2 max-w-full">
        <FormInputField
        id="couponCode"
        type="text"
        label="Have a coupon?"
        placeholder="Enter coupon code"
        v-model="code"
        @keyup.enter="apply"
        />
    </div>
    <Button
    type="button"
    @click="apply"
    :disabled="!code.trim()"
    text="Apply Coupon"
    contentClasses="mt-2 !px-3 text-sm !py-2uppercase"
    />
    
    <slot name="error"></slot>
  </div>
</template>
