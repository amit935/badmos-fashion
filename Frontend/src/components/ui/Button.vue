<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: String,
    default: 'primary',
    validator: val => ['primary', 'secondary', 'tertiary'].includes(val)
  },
  type: {
    type: String,
    default: 'button'
  },
  text: {
    type: String,
    default: ''
  },
  contentClasses: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  let base = [
    'py-4 px-6 text-base uppercase font-bold rounded-md border-2 border-black capitalize transition-colors duration-300',
    props.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
  ].join(' ')

  let categoryClasses = ''
  switch (props.category) {
    case 'primary':
      categoryClasses = props.disabled
        ? 'bg-gray-400 text-white border-gray-400'
        : 'bg-black text-white hover:text-black hover:bg-white'
      break
    case 'secondary':
      categoryClasses = props.disabled
        ? 'bg-gray-200 text-gray-500 border-gray-300'
        : 'bg-white text-black hover:text-white hover:bg-black'
      break
    case 'tertiary':
      categoryClasses = props.disabled
        ? 'bg-transparent text-gray-400 border-transparent'
        : 'bg-transparent text-black hover:text-gray-700 border-transparent'
      break
    default:
      categoryClasses = ''
  }
  return [base, categoryClasses, props.contentClasses].join(' ')
})


function onClick(event) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
 <button
  :class="buttonClasses"
  :type="type"
  :disabled="props.disabled"
  @click="onClick"
  aria-disabled="props.disabled"
>

    <slot>{{ text }}</slot>
  </button>
</template>
