<script setup>
import { watch, reactive } from 'vue'
import FormInputField from './FormInputField.vue'  // adjust path as needed

const props = defineProps({
  modelValue: Object,
  countries: { type: Array, default: () => [] },
  states: { type: Array, default: () => [] },
  showCountry: Boolean,
  showStates: Boolean
})
const emit = defineEmits(['update:modelValue'])
const address = reactive({ ...props.modelValue })

watch(address, val => emit('update:modelValue', { ...val }), { deep: true })

function updateField(field, value) {
  address[field] = value
}
</script>

<template>
  <form class="space-y-4" @submit.prevent>
    <FormInputField
      type="text"
      id="fullName"
      label="Full Name"
      placeholder="Full Name *"
      :modelValue="address.fullName"
      :isRequired="true"
      @update:modelValue="val => updateField('fullName', val)"
    />
    
    <FormInputField
      type="text"
      id="streetLine1"
      label="Address Line 1"
      placeholder="Address Line 1 *"
      :modelValue="address.streetLine1"
      :isRequired="true"
      @update:modelValue="val => updateField('streetLine1', val)"
    />
    
    <FormInputField
      type="text"
      id="streetLine2"
      label="Address Line 2"
      placeholder="Address Line 2"
      :modelValue="address.streetLine2"
      @update:modelValue="val => updateField('streetLine2', val)"
    />
    
    <FormInputField
      type="text"
      id="city"
      label="City"
      placeholder="City *"
      :modelValue="address.city"
      :isRequired="true"
      @update:modelValue="val => updateField('city', val)"
    />
    
    <FormInputField
      type="text"
      id="postalCode"
      label="Postal Code"
      placeholder="Postal Code *"
      :modelValue="address.postalCode"
      :isRequired="true"
      @update:modelValue="val => updateField('postalCode', val)"
    />
    
    <FormInputField
      type="text"
      id="phoneNumber"
      label="Phone Number"
      placeholder="Phone Number *"
      :modelValue="address.phoneNumber"
      :isRequired="true"
      @update:modelValue="val => updateField('phoneNumber', val)"
    />

    <FormInputField
        type="text"
        id="province"
        label="State / Province"
        placeholder="State/Province *"
        :modelValue="address.province"
        :isRequired="true"
        @update:modelValue="val => updateField('province', val)"
    />
    
    <template v-if="showCountry">
      <label for="countryCode" class="block mb-1 font-medium">Country *</label>
      <select
        id="countryCode"
        v-model="address.countryCode"
        required
        class="border border-gray-300 rounded-lg px-3 py-2 w-full"
      >
        <option disabled value="">Select country</option>
        <option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option>
      </select>
    </template>
  </form>
</template>
