<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'text',  // default type to text for flexibility
  },
  placeholder: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  showWarning: {
    type: Boolean,
    default: false,
  },
  warningMessage: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
}

function onBlur(event) {
  emit('blur', event)
}

function onFocus(event) {
  emit('focus', event)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="id" class="font-medium">
      {{ label }}
      <span v-if="isRequired" class="text-red-600">*</span>
    </label>

    <input
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :id="id"
      :required="isRequired"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      :class="[
        showWarning ? 'border-red-600' : 'border-gray-300',
        'border rounded-lg px-4 py-3 w-full transition',
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
      ]"
    />

    <p v-if="showWarning && warningMessage" class="text-red-600 text-sm italic">
      {{ warningMessage }}
    </p>
  </div>
</template>
