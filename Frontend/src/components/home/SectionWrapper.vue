<script setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <section
    class="space-y-4 max-w-(--global-max-width) mx-auto"
  >
    <div class="text-center text-black">
      <h1
        class="secondary-font text-[2.67rem] uppercase"
      >
        {{ title }}
      </h1>

      <p
        class="text-[1.67rem] uppercase text-black max-md:text-[1.47rem]"
        v-html="caption"
      ></p>
    </div>

    <slot name="content"></slot>
  </section>
</template>
