<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  panelDir: {
    type: String,
    default: 'right',
  },

  underline: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['open', 'close']);
const isOpen = ref(false);

const onMouseEnter = () => {
  isOpen.value = true;
  emit('open');
};

const onMouseLeave = () => {
  isOpen.value = false;
  emit('close');
};

// New toggle for click
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  emit(isOpen.value ? 'open' : 'close');
};

const panelDirClass = computed(() => {
  if (props.panelDir === 'left') {
    return 'left-0 right-auto';
  } else if (props.panelDir === 'right') {
    return 'right-0 left-auto';
  } else if (props.panelDir === 'center') {
    return 'left-1/2 -translate-x-1/2 right-auto';
  } else {
    return 'right-0 left-auto';
  }
});
</script>

<template>
  <div
    class="relative h-full"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      class="h-full px-2 py-1 flex items-center border-b-3 cursor-pointer"
      :class="isOpen && underline ? 'border-primary' : 'border-transparent'"
      @click="toggleDropdown"
    >
      <slot name="header" />
    </div>

    <div
      v-if="isOpen"
      :class="[
        'max-h-[580px] max-w-[720px] min-w-[175px] mt-1 p-4 absolute top-full border-2 border-black z-10 space-y-2 bg-white rounded-md overflow-auto',
        panelDirClass
      ]"
    >
      <slot name="panel" />
    </div>
  </div>
</template>
