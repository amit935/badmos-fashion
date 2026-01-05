<script setup>
import Button from '../components/ui/Button.vue';
import FormInputField from '../components/auth/form/FormInputField.vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import EmailVerification from '../components/auth/EmailVerification.vue';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePasswordValidation } from '../composables/usePasswordValidation';
import { usePasswordMatch } from '../composables/usePasswordMatch';
import { useEmailValidation } from '../composables/useEmailValidation';
import { useRegistration } from '../composables/useRegistration';
import { useRouter } from 'vue-router';


const router = useRouter();

// NAME VALIDATION
const name = ref('');
const nameTouched = ref(false);
const isNameValid = computed(() => {
    if (!nameTouched.value) return true;
    return name.value.trim().length > 0;
});

// EMAIL VALIDATION
const {
    email,
    isValid: isEmailValid,
    onInput: onEmailInput,
    getErrorCode: getEmailErrorCode,
    touched: emailTouched
} = useEmailValidation();

// PASSWORD VALIDATION
const {
  password,
  rules,
  isValid: isPasswordValid,
  onInput: onPasswordInput,
  onBlur,
  touched: passwordTouched
} = usePasswordValidation();

// CONFIRM PASSWORD VALIDATION
const {
    confirmPassword,
    isMatch: isConfirmPasswordValid,
    onInput: onConfirmPasswordInput,
    getErrorCode: getConfirmPasswordErrorCode,
    touched: confirmPasswordTouched,
} = usePasswordMatch('', password);

// I18N INITIALIZATION
const { t } = useI18n();

// SUBMISSION CONTROL
const isSubmitted = ref(false);

// FINAL FORM VALIDITY
const isFormValid = computed(() => 
    isNameValid.value &&
    isEmailValid.value &&
    isPasswordValid.value &&
    isConfirmPasswordValid.value
);

// ERROR MESSAGES
const emailErrorMessage = computed(() => {
    const code = getEmailErrorCode();
    if (!code) return '';
    return code === 'required'
        ? t('auth.register.errorMessages.emailRequired')
        : t('auth.register.errorMessages.emailInvalid');
});

const nameErrorMessage = computed(() => {
   if (!nameTouched.value && !isSubmitted.value) return '';
   return isNameValid.value
        ? ''
        : t('auth.register.errorMessages.nameRequired');
});

const confirmPasswordErrorMessage = computed(() => {
    const code = getConfirmPasswordErrorCode();
    return code === 'required'
        ? t('auth.register.errorMessages.confirmPasswordRequired')
        : t('auth.register.errorMessages.confirmPassword');
})

// REGISTRATION COMPOSABLE
const { register, isLoading, error: registrationError } = useRegistration();

// HANDLE FORM SUBMISSION
const handleSubmit = async () => {
  isSubmitted.value = true;
  nameTouched.value = true;
  emailTouched.value = true;
  passwordTouched.value = true;
  confirmPasswordTouched.value = true;

  if (!isFormValid.value) return;

  const result = await register({
    name: name.value,
    email: email.value,
    password: password.value,
  });

  if (result.success) {
    sessionStorage.setItem('pending-verification-email', email.value);
    setTimeout(() => sessionStorage.removeItem('pendingEmail'), 600000)
    router.push({
        name: 'email-verification',
    })
  }
};

</script>

<template>
    <AuthLayout @submit="handleSubmit">
        <template #header>
            <h1 class="text-5xl sm:text-6xl uppercase secondary-font">{{ t('auth.register.title') }}</h1>
            <p class="text-lg">{{ t('auth.register.caption') }}</p>
        </template>
        <template #form>
            <div v-if="registrationError" class="bg-red-100 p-2 text-red-800 font-bold">ERROR: {{ registrationError }}</div>
            <FormInputField
                type="name"
                placeholder="Enter your full name"
                id="name"
                label="Full Name"
                v-model="name"
                :isRequired="true"
                :showWarning="!isNameValid"
                :warningMessage="nameErrorMessage" />

            <FormInputField
                type="email"
                placeholder="Enter your email"
                id="email"
                label="Email"
                v-model="email"
                :isRequired="true"
                :showWarning="!isEmailValid"
                :warningMessage="emailErrorMessage"
                @input="onEmailInput" />

            <FormInputField
                type="password"
                placeholder="Create your password"
                id="create-password"
                label="Create Password"
                v-model="password"
                :isRequired="true"
                :showWarning="!isPasswordValid"
                @input="onPasswordInput"
                @blur="onBlur" />

            <ul v-if="!isPasswordValid" class="text-sm mt-2 space-y-1">
                <li
                    v-for="rule in rules"
                    :key="rule.key"
                    :class="{
                    'text-green-600': rule.valid,
                    'text-red-600': !rule.valid
                    }"
                    class="flex items-center text-xs"
                >
               <svg
                    v-if="rule.valid"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    />
                    </svg>

                    <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                    </svg>

                    <span class="text-base">{{ t(rule.label) }}</span>
                </li>
            </ul>

            <FormInputField
                type="password"
                placeholder="Re-enter your password"
                id="confirm-password"
                label="Re-Enter Password"
                v-model="confirmPassword"
                :isRequired="true"
                :showWarning="!isConfirmPasswordValid"
                :warningMessage="confirmPasswordErrorMessage"
                @input="onConfirmPasswordInput" />
            
            <Button category="primary" type="submit" :loading="isLoading" :text="t('auth.register.buttonText')" contentClasses="uppercase w-full" />
        </template>
        <template #formFooter>
            <p>
                {{ t('auth.register.redirectText') }}
                <RouterLink :to="{ name: 'login' }" class="underline font-bold">
                {{ t('auth.register.redirectLinkText') }}
                </RouterLink>
            </p>
             <p class="text-center">
            {{ t('auth.ackTermsAndConditions.title', { mode: 'registering' }) }}
            <RouterLink
                :to="{ name: 'multipurpose-detail', params: { multiPurposeSlug: 'terms-and-conditions' } }"
                class="underline font-bold"
            >
                Terms & Conditions
            </RouterLink>
            </p>
        </template>
    </AuthLayout>
</template>