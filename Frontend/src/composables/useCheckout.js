// composables/useCheckout.js
import { ref, computed } from 'vue'
import {
  activeOrder,
  isLoadingOrder,
  orderError,
  updateOrder,
  clearOrder,
  fetchActiveOrder,
  applyCoupon,
  removeCoupon,
  fetchCustomerAddresses,
  setShippingAddress,
  setBillingAddress,
  fetchEligibleShippingMethods,
  setShippingMethod,
  addPaymentToOrder,
  transitionOrderToState,
  settlePayment,
  saveCustomerAddress,
} from '../store/orderStore'

export function useCheckout() {
  // STATE - Pinia proxies (reactive)
  const isLoading = isLoadingOrder
  const error = orderError
  const order = activeOrder

  // Local UI state
  const currentStep = ref(1)
  const couponCode = ref('')
  const couponError = ref('')
  const isSavingAddress = ref(false)
  const previousAddressCount = ref(0)
  const saveAddressToAccount = ref(true)

  // Address state
  const savedAddresses = ref([])
  const eligibleShippingMethods = ref([])
  const selectedSavedAddress = ref(null)
  const useSameForBilling = ref(true)

  const shippingAddress = ref({
    fullName: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    countryCode: 'IN',
    phoneNumber: '',
  })

  const billingAddress = ref({
    fullName: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    countryCode: 'IN',
    phoneNumber: '',
  })

  // COMPOSITES (derived state)
  const hasSavedAddresses = computed(() => savedAddresses.value.length > 0)
  const showShippingForm = computed(() => !selectedSavedAddress.value)

  const isShippingFormValid = computed(() => {
    const addr = shippingAddress.value
    return (
      addr.fullName?.trim() &&
      addr.streetLine1?.trim() &&
      addr.city?.trim() &&
      addr.province?.trim() &&
      addr.postalCode?.trim() &&
      addr.phoneNumber?.trim()
    )
  })

  const isBillingFormValid = computed(() => {
    if (useSameForBilling.value) return isShippingFormValid.value
    const addr = billingAddress.value
    return (
      addr.fullName?.trim() &&
      addr.streetLine1?.trim() &&
      addr.city?.trim() &&
      addr.province?.trim() &&
      addr.postalCode?.trim() &&
      addr.phoneNumber?.trim() &&
      addr.countryCode?.trim()
    )
  })

  const canSaveAndContinue = computed(() => {
    if (showShippingForm.value) return isShippingFormValid.value && isBillingFormValid.value
    return selectedSavedAddress.value ? true : false
  })

  const addressSavedSuccessfully = computed(() => 
    savedAddresses.value.length > previousAddressCount.value
  )

  // METHODS
  const loadSavedAddresses = async (forceRefresh = false) => {
    try {
      const previousCount = savedAddresses.value.length
      const result = await fetchCustomerAddresses()
      
      if (result.success) {
        savedAddresses.value = result.addresses || []
        previousAddressCount.value = previousCount
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Failed to load addresses:', err)
      savedAddresses.value = []
      return { success: false, error: err.message }
    }
  }

  const refreshSavedAddresses = () => loadSavedAddresses(true)

  const selectSavedAddress = (addressId) => {
    const address = savedAddresses.value.find(a => a.id === addressId)
    if (!address) return false
    
    selectedSavedAddress.value = address.id
    shippingAddress.value = {
      fullName: address.fullName || '',
      streetLine1: address.streetLine1 || '',
      streetLine2: address.streetLine2 || '',
      city: address.city || '',
      province: address.province || '',
      postalCode: address.postalCode || '',
      countryCode: address.country?.code || 'IN',
      phoneNumber: address.phoneNumber || ''
    }
    
    if (useSameForBilling.value) {
      billingAddress.value = { ...shippingAddress.value }
    }
    return true
  }

  const useDifferentAddress = () => {
    selectedSavedAddress.value = null
    shippingAddress.value = {
      ...shippingAddress.value,
      fullName: shippingAddress.value.fullName || '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      province: '',
      postalCode: '',
      countryCode: 'IN',
      phoneNumber: shippingAddress.value.phoneNumber || ''
    }
    if (useSameForBilling.value) {
      billingAddress.value = { ...shippingAddress.value }
    }
  }

  const handleSaveAddress = async () => {
    if (!canSaveAndContinue.value) {
      error.value = 'Please fill all required fields'
      return false
    }

    isSavingAddress.value = true
    error.value = null

    try {
      // Step 0: Save to customer account ONLY if using new/different address
      if (saveAddressToAccount.value && showShippingForm.value && !selectedSavedAddress.value) {
        const saveResult = await saveCustomerAddress({ ...shippingAddress.value })
        if (!saveResult.success) {
          console.warn('Address not saved to account:', saveResult.error)
        }
      }

      // Step 1: Set shipping address (for current order)
      const shippingResult = await setShippingAddress({ ...shippingAddress.value })
      if (!shippingResult?.success) {
        error.value = shippingResult?.error || 'Failed to save shipping address'
        return false
      }

      // Step 2: Get shipping methods
      const methodsResult = await fetchEligibleShippingMethods()
      eligibleShippingMethods.value = methodsResult?.methods || []

      // Step 3: Auto-select first shipping method
      if (eligibleShippingMethods.value.length > 0) {
        await setShippingMethod(eligibleShippingMethods.value[0].id)
      }

      // Step 4: Set billing address
      const billingInput = useSameForBilling.value 
        ? { ...shippingAddress.value } 
        : { ...billingAddress.value }
      
      const billingResult = await setBillingAddress(billingInput)
      if (!billingResult?.success) {
        error.value = billingResult?.error || 'Failed to save billing address'
        return false
      }

      // Step 5: Refresh saved addresses
      await refreshSavedAddresses()

      // Step 6: Proceed
      currentStep.value = 2
      return true

    } catch (err) {
      error.value = err.message || 'Failed to save addresses'
      return false
    } finally {
      isSavingAddress.value = false
    }
  }

  const handleApplyCoupon = async (code) => {
    if (!code?.trim()) return false
    
    couponError.value = ''
    const result = await applyCoupon(code.trim())
    
    if (!result?.success) {
      couponError.value = result?.error || 'Invalid coupon code'
      return false
    }
    couponCode.value = code.trim()
    return true
  }

  const handleRemoveCoupon = async (code) => {
    await removeCoupon(code)
    couponCode.value = ''
    couponError.value = ''
  }

  const handleProceedToPayment = async (openRazorpayCheckout, paymentCallbacks = {}) => {
    if (!order.value?.shippingAddress || !order.value?.billingAddress) {
      error.value = 'Please complete shipping and billing details'
      return false
    }

    try {
      // Refresh order first
      await fetchActiveOrder()
      
      const currentState = order.value.state
      if (currentState !== 'ArrangingPayment') {
        const transitionResult = await transitionOrderToState('ArrangingPayment')
        if (!transitionResult?.success) {
          error.value = 'Failed to prepare order for payment'
          return false
        }
        await fetchActiveOrder()
      }

      // Add payment
      const paymentResult = await addPaymentToOrder({
        method: 'razorpay-payment',
        metadata: {}
      })

      if (!paymentResult?.success) {
        error.value = paymentResult?.error || 'Failed to create payment'
        return false
      }

      const payment = paymentResult.order.payments?.find(p => p.method === 'razorpay-payment')
      const razorpayOrderId = payment?.metadata?.public?.razorpayOrderId
      
      if (!razorpayOrderId) {
        error.value = 'Failed to create Razorpay order'
        return false
      }

      // Open Razorpay
      openRazorpayCheckout({
        razorpayOrderId,
        amount: order.value.totalWithTax,
        currency: order.value.currencyCode,
        customer: {
          fullName: order.value.shippingAddress?.fullName || '',
          emailAddress: order.value.customer?.emailAddress || '',
          phoneNumber: order.value.shippingAddress?.phoneNumber || '',
        },
        onSuccess: paymentCallbacks?.onSuccess,
        onFailure: paymentCallbacks?.onFailure,
      })

      return true
    } catch (err) {
      error.value = err.message || 'Payment initiation failed'
      return false
    }
  }

  return {
    // State
    activeOrder: order,
    isLoading,
    error,
    currentStep,
    couponCode,
    couponError,
    savedAddresses,
    selectedSavedAddress,
    useSameForBilling,
    isSavingAddress,
    shippingAddress,
    billingAddress,
    eligibleShippingMethods,
    hasSavedAddresses,
    showShippingForm,
    isShippingFormValid,
    isBillingFormValid,
    canSaveAndContinue,
    addressSavedSuccessfully,
    saveAddressToAccount,

    // Methods
    fetchActiveOrder,
    loadSavedAddresses,
    refreshSavedAddresses,
    selectSavedAddress,
    useDifferentAddress,
    handleSaveAddress,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleProceedToPayment,
  }
}
