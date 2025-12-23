<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router'; 
import { useRegistration } from '../composables/useRegistration';
import AuthLayout from '../layouts/AuthLayout.vue';
import Button from '../components/ui/Button.vue';

const { t } = useI18n();
const { verifyCustomer, resendVerificationEmail, isLoading } = useRegistration();

const router = useRouter();
const route = useRoute();

const verificationToken = ref(route.query.token || ''); 
const pendingVerificationMail = ref(sessionStorage.getItem('pending-verification-email') || '');
const verificationError = ref('');

// ✅ FIXED: Cross-tab BroadcastChannel
const verificationChannel = new BroadcastChannel('badmos-verification');

// ✅ FIXED: 2-minute resend timer
const resendCooldown = ref(0)
let resendIntervalId = null

const startResendTimer = () => {
  resendCooldown.value = 120
  if (resendIntervalId) clearInterval(resendIntervalId)
  
  resendIntervalId = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value -= 1
    } else {
      clearInterval(resendIntervalId)
      resendIntervalId = null
    }
  }, 1000)
}

if (!pendingVerificationMail.value) {
    router.push({ name: 'root' });
}

onMounted(() => {
  // ✅ FIXED: Cross-tab listener
  verificationChannel.onmessage = (event) => {
    if (event.data.type === 'verified') {
      sessionStorage.removeItem('pending-verification-email');
      pendingVerificationMail.value = '';
      if (window.location.pathname.includes('/verify-email')) {
        router.push({ name: 'root' });
      }
    }
  };
});

onMounted(async () => {
    if (verificationToken.value) {
        try {
            const result = await verifyCustomer(verificationToken.value);
            console.log('Verification Result:', result);
            if (result.success) {
                // ✅ FIXED: Notify ALL tabs first
                verificationChannel.postMessage({ 
                  type: 'verified', 
                  email: pendingVerificationMail.value 
                });
                sessionStorage.removeItem('pending-verification-email');
                router.push({ name: 'root' });
            } else {
                verificationError.value = result.error || 'Verification Failed';
            }
        } catch (err) {
            console.error('Verification failed:', err);
        }
    }
})

// ✅ FIXED: Proper cleanup
onUnmounted(() => {
  if (resendIntervalId) clearInterval(resendIntervalId);
  verificationChannel.close();
})
</script>

<template>
  <AuthLayout>
    <template #header>
      <h1 v-if="pendingVerificationMail && !verificationToken" 
          class="text-5xl sm:text-6xl uppercase secondary-font">
        {{ t('auth.register.emailVerification.title') }}
      </h1>
      <h1 v-else-if="verificationError" 
          class="text-5xl sm:text-6xl uppercase secondary-font">
        {{ t('auth.register.emailVerification.error.title') }}
      </h1>
      <h1 v-else-if="isLoading" class="text-5xl sm:text-6xl uppercase secondary-font">
        Verifying Email...
      </h1>
    </template>

    <template #multipurpose>
      <div v-if="pendingVerificationMail && !verificationToken">
        <p class="mb-6">
          {{ t('auth.register.emailVerification.message', { email: pendingVerificationMail }) }}
        </p>
        <Button 
          @click="resendVerificationEmail(pendingVerificationMail); startResendTimer()"
          :disabled="resendCooldown > 0"
          :text="resendCooldown > 0 ? `Resend in ${resendCooldown}s` : t('auth.register.emailVerification.resend')">
        </Button>
      </div>

      <div v-else-if="isLoading" class="text-center py-12">
        <p>Verifying your email...</p>
      </div>
      
      <div v-else-if="verificationError" class="text-red-500">
        <p>{{ verificationError }}</p>
        <Button @click="router.back()" text="Try Again">
        </Button>
      </div>
    </template>
  </AuthLayout>
</template>
    