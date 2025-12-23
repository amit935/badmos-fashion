<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    email: {
        type: String,
        required: true
    }
});


const email = computed(() => props.email);
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white">
    <h1 class="text-4xl font-bold mb-4">{{ t('auth.register.emailVerification.title') }}</h1>
    <p class="mb-6">
      {{ t('auth.register.emailVerification.message', { email }) }}
    </p>
    <!-- <p>
      {{ t('auth.emailVerification.notReceived') }}
    </p> -->
  </div>
</template>