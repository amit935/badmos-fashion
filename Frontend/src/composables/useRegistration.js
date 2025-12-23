import { ref } from 'vue'
import client from '../api/client'
import { REGISTER_CUSTOMER, RESEND_VERIFICATION_EMAIL, VERIFY_CUSTOMER_EMAIL } from '../api/mutations'
import { useAuthStore } from '../store/authStore'

export function useRegistration() {
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const error = ref('')
  const successMessage = ref('')

  const register = async ({ name, email, password }) => {
    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ') || ''

      const response = await client.request(REGISTER_CUSTOMER, {
        input: {
          firstName,
          lastName,
          emailAddress: email,
          password,
        }
      })

      const result = response.registerCustomerAccount
      console.log('Registration result:', result)

      if (result.__typename === 'Success') {
        successMessage.value = 'Check your email to verify!'
        return { success: true, message: successMessage.value }
      } else {
        error.value = result.message || 'Registration failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.response?.errors?.[0]?.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const verifyCustomer = async (token) => {
    isLoading.value = true
    error.value = ''
    try {
      const response = await client.request(VERIFY_CUSTOMER_EMAIL, {
        token: token,
      })

      const result = response.verifyCustomerAccount

      console.log('Verification result:', result)

      if (result.__typename === 'CurrentUser') {
        authStore.setUser(result)
        successMessage.value = 'Account verified and logged in!'
        return { success: true, message: successMessage.value }
      } else {
        error.value = result.message || 'Verification failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.response?.errors?.[0]?.message || 'Verification failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const resendVerificationEmail = async (email) => {
    try {
      const response = await client.request(RESEND_VERIFICATION_EMAIL, {
        emailAddress: email,
      })

      const result = response.resendVerificationEmail

      if (result.__typename === 'Success') {
        return { success: true, message: 'Verification email resent!' }
      } else {
        error.value = result.message || 'Verification failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.response?.errors?.[0]?.message || 'Verification failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    register,
    verifyCustomer,
    resendVerificationEmail,
    isLoading,
    error,
  }
}
