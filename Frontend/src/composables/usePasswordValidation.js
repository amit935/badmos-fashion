import { ref, computed } from 'vue';

export function usePasswordValidation(initial = '') {
  const password = ref(initial);
  const touched = ref(false);

  const hasMinLength = computed(() => password.value.length >= 8);
  const hasNumber = computed(() => /\d/.test(password.value));
  const hasLowercase = computed(() => /[a-z]/.test(password.value));
  const hasUppercase = computed(() => /[A-Z]/.test(password.value));
  const hasSpecialChar = computed(() => /[!@#\$%\^&\*]/.test(password.value));

  const rules = computed(() => [
    { key: 'minLength', label: 'auth.register.passwordRules.minLength', valid: hasMinLength.value },
    { key: 'number', label: 'auth.register.passwordRules.number', valid: hasNumber.value },
    { key: 'lowercase', label: 'auth.register.passwordRules.lowercase', valid: hasLowercase.value },
    { key: 'uppercase', label: 'auth.register.passwordRules.uppercase', valid: hasUppercase.value },
    { key: 'specialChar', label: 'auth.register.passwordRules.specialChar', valid: hasSpecialChar.value }
  ]);

  const isValid = computed(() => {
    if (!touched.value) return true;
    return rules.value.every(rule => rule.valid);
  });

//   const showRules = computed(() => password.value !== '');

  const onInput = () => {
    touched.value = true;
  };

  const onBlur = () => {
    touched.value = true;
  }

  return {
    password,
    rules,
    isValid,
    onInput,
    onBlur,
    touched,
  };
}
