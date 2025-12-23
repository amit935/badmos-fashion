import { ref } from 'vue'
import client from '../api/client'
import { LOGIN_CUSTOMER, REQUEST_PASSWORD_RESET, RESET_PASSWORD } from '../api/mutations'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const error = ref('')

  const login = async ({ email, password, isRememberMe = true }) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await client.request(LOGIN_CUSTOMER, {
        emailAddress: email,
        password,
        rememberMe: isRememberMe
      })
      
      const result = response.login
      
      if (result.id || result.__typename === 'CurrentUser') {
        authStore.setUser(result)
        return { success: true, user: result }
      } else {
        error.value = result.message || 'Invalid credentials'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const graphQLError = err.response?.errors?.[0]
      error.value = graphQLError?.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const requestPasswordReset = async (reqObj) => {
    isLoading.value = true
    error.value = ''

    try {
        const response = await client.request(REQUEST_PASSWORD_RESET, reqObj);

        const result = response.requestPasswordReset

        if (result.success || result.__typename === 'Success') {
            return { success: true, message: 'Password reset email sent! Check you inbox spam.'}
        }
    } catch(err) {
            const graphQLError = err.response?.errors?.[0]
            error.value = graphQLError?.message || 'Password reset request failed'
                    console.log('Password reset request result:', err)
            return { success: false, error: error.value }
    } finally {
        isLoading.value = false
    }
  }

  const resetPassword = async (reqObj) => {
    isLoading.value = true
    error.value = ''

    try {
        const response = await client.request(RESET_PASSWORD, reqObj);

        const result = response.resetPassword

        if (result.id || result.__typename === 'CurrentUser') {
            return { success: true, user: result }
        }
    } catch (err) {
        const graphQLError = err.response?.errors?.[0]
        error.value = graphQLError?.message || 'Password reset failed'
        return { success: false, error: error.value }
    } finally {
        isLoading.value = false
    }
  }

  return { login,
    requestPasswordReset,
    resetPassword,

    isLoading,
    error
   }
}
