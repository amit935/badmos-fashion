import { ref, computed } from 'vue';

export function usePasswordMatch(initial = '', password = null) {
  const confirmPassword = ref(initial);
  const touched = ref(false);

  const isMatch = computed(() => {
    if (!touched.value) return true;
    return confirmPassword.value === password.value;
  });

  const onInput = () => {
    touched.value = true;
  };

  const getErrorCode = () => {
    if (!touched.value) return null;
    if (!password || !password.value) return null;
    if (confirmPassword.value.trim().length <= 0) return 'required';
  };

  return {
    confirmPassword,
    isMatch,
    getErrorCode,
    onInput,
    touched,
  };
}
