import { ref, computed } from 'vue';

export function useEmailValidation(initial = '') {
    const email = ref(initial);
    const touched = ref(false);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const isValid = computed(() => {
        if (!touched.value) return true;
        return emailPattern.test(email.value);
    })

    const onInput = () => {
        touched.value = true;
    }

    const getErrorCode = () => {
        if (!touched.value) return null;
        if (email.value === '') return 'required';
        if (!isValid.value) return 'invalid';
        return null;
    }

    return {
        email,
        isValid,
        onInput,
        getErrorCode,
        touched,
    }
}