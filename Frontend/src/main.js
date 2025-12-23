import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router.js'
import i18n from './i18n/index.js'
import { createPinia } from 'pinia'
import client from './api/client.js'
import { GET_ACTIVE_CUSTOMER } from './api/queries.js'
import { useAuthStore } from './store/authStore.js'
import Spinner from '../src/components/ui/LoadingSpinner.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(i18n)
app.component('Spinner', Spinner)

async function restoreAuthSession() {
  const authStore = useAuthStore()

  try {
    const res = await client.request(GET_ACTIVE_CUSTOMER)
    
    if (res.activeCustomer?.id) { 
      authStore.setUser(res.activeCustomer)
    } else {
      authStore.clearUser()
    }
  } catch (error) {
    console.log('Auth restore failed:', error)
    authStore.clearUser()
  }
}

Promise.all([
  restoreAuthSession(),
  router.isReady()
]).finally(() => {
  app.mount('#app')
})
