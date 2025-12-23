import { ref } from 'vue';
import client from '../api/client';
import { SIGNOUT_CUSTOMER } from '../api/mutations';
import { useAuthStore } from '../store/authStore';

export function useSignout() {
    const authStore = useAuthStore()
    const isLoading = ref(false);
    const error = ref('');
        
    const signOut = async () => {
        try {
            const response = await client.request(SIGNOUT_CUSTOMER)

            const result = response.logout;
            
            if (result.success) {
                authStore.clearUser()
                return { success: true, user: result };
            } else {
                error.value = result.message;
                return { success: false, error: error.value };
            }
        } catch (e) {
        console.error('Logout failed', e)
        }
    }

    return { signOut, isLoading, error }
}