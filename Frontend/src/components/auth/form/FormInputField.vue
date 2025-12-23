<script setup>
const props = defineProps({
type: {
    type: String,
    required: true
},
placeholder: {
    type: String,
    required: true
},
modelValue: {
    type: String,
    required: true
},
id: {
    type: String,
    required: true
},
label: {
    type: String,
    required: true
},
isRequired: {
    type: Boolean,
    default: false
},
showWarning: {
    type: Boolean,
    default: false
},
warningMessage: {
    type: String,
    default: ''
}
})

const emit = defineEmits(['update:modelValue'])

function onInput(event) {
emit('update:modelValue', event.target.value)
}
</script>

<template>
    <div class="flex flex-col gap-1">
        <label :for="id">
        {{ label }}
        <span v-if="showWarning" class="text-red-600">*</span>
        </label>

        <input
            :class="[showWarning ? 'border-red-600' : 'border-gray-300', 'border rounded-lg w-auto px-4 py-4']"
            :type="type"
            :placeholder="placeholder"
            :value="modelValue"
            :id="id"
            @input="onInput"
            :required="props.isRequired"
        />

        <p v-if="showWarning" class="text-red-600 txt-sm italic">
            {{ warningMessage}}
        </p>
    </div>
</template>
  