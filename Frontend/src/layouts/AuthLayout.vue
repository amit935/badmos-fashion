<script setup>
import { defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLogo from '../components/ui/AppLogo.vue';

const emit = defineEmits(['submit']);
function onFormSubmit(e) {
  e.preventDefault();
  emit('submit');
}

const { t } = useI18n();
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center space-y-6 px-8 py-8 sm:px-0">
    <RouterLink :to="{ name: 'root' }">
      <AppLogo size="large" />
    </RouterLink>
    <div class="py-12 px-4 sm:px-8 space-y-4 bg-white rounded-lg max-w-full sm:max-w-lg border border-black">
      <slot name="header"></slot>
      <form class="space-y-4" @submit="onFormSubmit">
        <slot name="form"></slot>
      </form>
      <slot name="multipurpose"></slot>
      <slot name="formFooter"></slot>
    </div>
    <footer>
      <p class="text-center">{{ t('footer.copyright') }}</p>
    </footer>
  </div>
</template>
