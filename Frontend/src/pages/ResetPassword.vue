<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useEmailValidation } from '../composables/useEmailValidation';
import { useLogin } from '../composables/useLogin';
import AuthLayout from '../layouts/AuthLayout.vue';
import Button from '../components/ui/Button.vue';
import FormInputField from '../components/auth/form/FormInputField.vue';
import ErrorWarning from '../components/ui/ErrorWarning.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const { requestPasswordReset, resetPassword, isLoading, error: resetError } = useLogin();

// Email mode (no token)
const {
  email,
  isValid: isEmailValid,
  getErrorCode: getEmailErrorCode,
  touched: emailTouched
} = useEmailValidation();

// Password mode (has token)
const password = ref('');
const confirmPassword = ref('');
const passwordTouched = ref(false);
const confirmPasswordTouched = ref(false);

const isSubmitted = ref(false);
const successMessage = ref('');
// Token detection
const hasResetToken = computed(() => !!route.query.token);
const token = computed(() => route.query.token || '');

// Validations
const isPasswordValid = computed(() => {
  if (!passwordTouched.value) return true;
  return password.value.trim().length >= 8;
});

const isConfirmPasswordValid = computed(() => {
  if (!confirmPasswordTouched.value) return true;
  return password.value === confirmPassword.value;
});

// Errors
const emailErrorMessage = computed(() => {
  const code = getEmailErrorCode();
  if (!code) return '';
  return code === 'required'
    ? t('auth.resetPassword.emailRequired')
    : t('auth.resetPassword.emailInvalid');
});

const passwordErrorMessage = computed(() => {
  if (!passwordTouched.value && !isSubmitted.value) return '';
  return isPasswordValid.value ? '' : t('auth.resetPassword.passwordTooShort');
});

const confirmPasswordErrorMessage = computed(() => {
  if (!confirmPasswordTouched.value && !isSubmitted.value) return '';
  return isConfirmPasswordValid.value ? '' : t('auth.resetPassword.passwordsMismatch');
});

const isFormValid = computed(() => {
  if (hasResetToken.value) {
    return isPasswordValid.value && isConfirmPasswordValid.value;
  }
  return isEmailValid.value;
});

// ✅ FIXED: Reload-proof timer with sessionStorage
const resendCooldown = ref(0)
let resendIntervalId = null

onMounted(() => {
  const saved = sessionStorage.getItem('resetCooldown');
  if (saved) {
    const { timeLeft, expiry } = JSON.parse(saved);
    if (Date.now() < expiry) {
      resendCooldown.value = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      startResendTimer();
    } else {
      sessionStorage.removeItem('resetCooldown');
    }
  }
});

const startResendTimer = () => {
  resendCooldown.value = 120
  const expiry = Date.now() + 120 * 1000;
  
  sessionStorage.setItem('resetCooldown', JSON.stringify({
    timeLeft: resendCooldown.value,
    expiry
  }));
  
  if (resendIntervalId) clearInterval(resendIntervalId)
  
  resendIntervalId = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value -= 1
      
      sessionStorage.setItem('resetCooldown', JSON.stringify({
        timeLeft: resendCooldown.value,
        expiry
      }));
    } else {
      clearInterval(resendIntervalId)
      resendIntervalId = null
      sessionStorage.removeItem('resetCooldown');
    }
  }, 1000)
}

onUnmounted(() => {
  if (resendIntervalId) clearInterval(resendIntervalId);
});

const handleSubmit = async () => {
  isSubmitted.value = true;
  
  if (hasResetToken.value) {
    // Password reset mode
    passwordTouched.value = true;
    confirmPasswordTouched.value = true;
    if (!isFormValid.value) return;
    
    const result = await resetPassword({
      token: token.value,
      password: password.value
    });
    
    if (result.__typename === 'CurrentUser') {
      router.push({ name: 'root' });
    }
  } else {
    // Email request mode
    emailTouched.value = true;
    if (!isFormValid.value) return;
    
    const result = await requestPasswordReset({ emailAddress: email.value });
    if (result.success) {
      successMessage.value = result.message;
      startResendTimer();
    }
  }
};
</script>

<template>
  <AuthLayout @submit="handleSubmit">
    <template #header>
      <h1 class="text-5xl sm:text-6xl uppercase secondary-font">
        {{ hasResetToken ? t('auth.resetPassword.newPasswordTitle') : t('auth.resetPassword.title') }}
      </h1>
      <p class="text-lg">
        {{ hasResetToken ? t('auth.resetPassword.newPasswordCaption') : t('auth.resetPassword.caption') }}
      </p>
      <ErrorWarning v-if="resetError" :message="resetError" type="error" class="mt-4" />
      <ErrorWarning v-if="successMessage" :message="successMessage" type="success" class="mt-4" />
    </template>
    
    <template #form>
      <!-- Email request form (no token) -->
      <FormInputField
        v-if="!hasResetToken"
        type="email"
        placeholder="Enter your email"
        id="email"
        label="Email"
        v-model="email"
        :isRequired="true"
        :showWarning="!isEmailValid"
        :warningMessage="emailErrorMessage" />
      
      <!-- Password reset form (has token) -->
      <FormInputField
        v-if="hasResetToken"
        type="password"
        placeholder="Enter new password"
        id="password"
        label="New Password"
        v-model="password"
        :isRequired="true"
        :showWarning="!isPasswordValid"
        :warningMessage="passwordErrorMessage" />
      
      <FormInputField
        v-if="hasResetToken"
        type="password"
        placeholder="Confirm new password"
        id="confirm-password"
        label="Confirm Password"
        v-model="confirmPassword"
        :isRequired="true"
        :showWarning="!isConfirmPasswordValid"
        :warningMessage="confirmPasswordErrorMessage" />
      
      <Button 
        v-if="!hasResetToken"
        category="primary" 
        type="submit" 
        :disabled="resendCooldown > 0 || isLoading"
        :text="resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isLoading ? t('auth.resetPassword.sending') : t('auth.resetPassword.sendLink')" 
        contentClasses="uppercase w-full" 
      />

      <Button 
        v-if="hasResetToken"
        category="primary" 
        type="submit" 
        :disabled="isLoading"
        :text="isLoading ? t('auth.resetPassword.sending') : t('auth.resetPassword.buttonText')" 
        contentClasses="uppercase w-full" 
      />
    </template>
    
    <template #formFooter>
      <p>
        {{ t('auth.resetPassword.backToLogin') }}
        <RouterLink :to="{ name: 'login' }" class="underline font-bold">
          {{ t('auth.resetPassword.loginLink') }}
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>
