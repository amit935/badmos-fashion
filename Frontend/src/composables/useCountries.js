// composables/useCountries.js
import { ref, onMounted } from 'vue'
import client from '../api/client'
import { GET_COUNTRIES } from '../api/queries'  // Your pre-defined gql query

export function useCountries() {
  const countries = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchCountries = async () => {
    loading.value = true
    error.value = null
    try {
      const { availableCountries } = await client.request(GET_COUNTRIES)
      countries.value = availableCountries
    } catch (err) {
      error.value = err
      console.error('Failed to fetch countries:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchCountries()
  })

  return {
    countries,
    loading,
    error,
    fetchCountries,
  }
}
