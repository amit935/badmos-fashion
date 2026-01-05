<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEmailValidation } from '../composables/useEmailValidation';
import { useLogin } from '../composables/useLogin';
import { useRouter } from 'vue-router';

import Button from '../components/ui/Button.vue';
import FormInputField from '../components/auth/form/FormInputField.vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import ErrorWarning from '../components/ui/ErrorWarning.vue';

const { t } = useI18n();
const router = useRouter();

// FORM INPUT VALIDATIONS
const {
    email,
    isValid: isEmailValid,
    onInput: onEmailInput,
    getErrorCode: getEmailErrorCode,
    touched: emailTouched
} = useEmailValidation();

const password = ref('');
const passwordTouched = ref(false);
const isPasswordValid = computed(() => {
    if (!passwordTouched.value) return true;
    return password.value.trim().length > 0;
});

// ERROR MESSAGES
const emailErrorMessage = computed(() => {
    const code = getEmailErrorCode();
    if(!code) return '';
    return code === 'required'
        ? t('auth.register.errorMessages.emailRequired')
        : t('auth.register.errorMessages.emailInvalid');
});
 
const passwordErrorMessage = computed(() => {
   if (!passwordTouched.value && !isSubmitted.value) return '';
   return isPasswordValid.value
        ? ''
        : t('auth.register.errorMessages.passwordRequired');
});

// SUBMISSION CONTROL
const isSubmitted = ref(false);

// FINAL FORM VALIDATION
const isFormValid = computed(() =>
    isEmailValid.value &&
    isPasswordValid.value
);

const { login, isLoading, error: loginError } = useLogin();

const handleSubmit = async () => {
    isSubmitted.value = true;
    emailTouched.value = true;
    passwordTouched.value = true;
    if (!isFormValid.value) return;
    const result = await login({
        email: email.value,
        password: password.value,
        isRememberMe: false,
    });
    console.log(result)
    if (result.success) {
        router.push('/');
    }
};
</script>

<template>
    <AuthLayout @submit="handleSubmit">
        <template #header>
            <h1 class="text-5xl sm:text-6xl uppercase secondary-font">{{ t('auth.login.title') }}</h1>
            <p class="text-lg">{{ t('auth.login.caption') }}</p>
            <ErrorWarning v-if="loginError" :message="loginError" type="error" class="mt-4" />
        </template>
        <template #form>
            <FormInputField
                type="email"
                placeholder="Enter your email"
                id="email"
                label="Email"
                v-model="email"
                :isRequired="true"
                :showWarning="!isEmailValid"
                :warningMessage="getEmailErrorCode" />
            <FormInputField
                type="password"
                placeholder="Enter your password"
                id="password"
                label="Password"
                v-model="password"
                :isRequired="true"
                :showWarning="!isPasswordValid"
                :warningMessage="passwordErrorMessage" />
            
            <!-- ✅ ADDED: Reset password link -->
            <p class="text-sm text-right mt-2 mb-4">
                <RouterLink :to="{ name: 'reset-password' }" class="text-primary underline">
                    {{ t('auth.resetPassword.title') }}
                </RouterLink>
            </p>

            <Button category="primary" type="submit" :loading="isLoading" :text="t('auth.login.buttonText')" contentClasses="uppercase w-full" />
        </template>
        <template #formFooter>
            <p>
                {{ t('auth.login.redirectText') }}
                <RouterLink :to="{ name: 'register' }" class="underline font-bold">
                {{ t('auth.login.redirectLinkText') }}
                </RouterLink>
                
            </p>
         <p class="text-center">
            {{ t('auth.ackTermsAndConditions.title', { mode: 'logging in' }) }}
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
