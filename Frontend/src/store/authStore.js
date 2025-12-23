// store/authStore.js - FIXED
import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'
import { GET_ACTIVE_CUSTOMER } from '../api/queries'


export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isAuthReady = ref(false)
  const isLoadingAuth = ref(false)

  const initAuth = async () => {
    isLoadingAuth.value = true
    try {
      const { activeCustomer } = await client.request(GET_ACTIVE_CUSTOMER)
      
      if (activeCustomer) {
        user.value = activeCustomer
        isAuthenticated.value = true
      } else {
        user.value = null
        isAuthenticated.value = false
      }
    } catch {
      user.value = null
      isAuthenticated.value = false
    } finally {
      isLoadingAuth.value = false
      isAuthReady.value = true
    }
  }

  const setUser = (userInfo) => {
    user.value = userInfo
    isAuthenticated.value = !!userInfo?.id
    isAuthReady.value = true
  }

  const clearUser = () => {
    user.value = null
    isAuthenticated.value = false
    isAuthReady.value = false
    
    document.cookie = "vendure-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "vendure-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  }

  const canAccessProtected = () => 
    isAuthReady.value && isAuthenticated.value && !isLoadingAuth.value

  return {
    user,
    isAuthenticated,
    isLoadingAuth,
    isAuthReady,
    canAccessProtected,
    initAuth,
    setUser,
    clearUser,
  }
})