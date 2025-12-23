<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <div class=" flex items-center justify-center text-[12rem] m-auto secondary-font space-x-8 sm:text-[24rem]">
      <p>4</p>
      <RouterLink :to="{ name: 'root' }"><img src="/src/assets/logo-graphic.svg" alt="Badmos Fashion" class="w-26 sm:w-[196px]" /></RouterLink>
      <p>4</p>
    </div>
  </div>
</template>
