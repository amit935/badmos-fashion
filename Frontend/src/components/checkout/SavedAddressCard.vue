<script setup>
const props = defineProps({ address: Object, selected: Boolean })
defineEmits(['select'])
</script>

<template>
  <div
    :class="['relative border-1 border-black rounded-md p-4', { selected }]"
    @click="$emit('select', address.id)"
  >
    <div class="font-bold">{{ address.fullName }}</div>
    <div>{{ address.streetLine1 }}</div>
    <div v-if="address.streetLine2">{{ address.streetLine2 }}</div>
    <div>{{ address.city }}, {{ address.province }} {{ address.postalCode }}</div>
    <div>{{ address.phoneNumber }}</div>
    <span v-if="selected" class="absolute material-symbols-outlined top-0 right-0 m-2">
        check_small
    </span>
  </div>
</template>