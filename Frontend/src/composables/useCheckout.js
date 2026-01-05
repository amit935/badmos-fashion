import { ref, computed, watch } from 'vue'
import {
  activeOrder,
  isLoadingOrder,
  orderError,
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
  saveCustomerAddress,
} from '../store/orderStore'

import { useRazorpay } from './useRazorpay'
import { useRouter } from 'vue-router'

export function useCheckout() {
  // STATE - Pinia proxies (reactive)
  const isLoading = isLoadingOrder
  const error = orderError
  const order = activeOrder

  const { verifyRazorpayPayment, isPaymentVerifying } = useRazorpay()
  const router = useRouter()

  // Local UI state
  const currentStep = ref(1)
  const couponCode = ref('')
  const couponError = ref('')
  const isSavingAddress = ref(false)
  const previousAddressCount = ref(0)
  const saveAddressToAccount = ref(true)
  const paymentVerificationError = ref('')

  // Address state
  const savedAddresses = ref([])
  const eligibleShippingMethods = ref([])
  const selectedSavedAddress = ref(null)
  const useSameForBilling = ref(true)

  // Payment state
  const isPaymentProcessing = ref(false)
  const isRazorpayPaymentVerifying = computed(() => isPaymentVerifying.value)
  const cachedOrderForPayment = ref(null) // ✅ Moved here for better organization

  // Form state
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
      addr.phoneNumber?.trim()
    )
  })

  const canSaveAndContinue = computed(() => {
    if (showShippingForm.value) return isShippingFormValid.value && isBillingFormValid.value
    return !!selectedSavedAddress.value
  })

  const addressSavedSuccessfully = computed(() => 
    savedAddresses.value.length > previousAddressCount.value
  )

  // ✅ REMOVED: clearUnsettledOrder() - not used anywhere

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
    const phone = shippingAddress.value.phoneNumber
    shippingAddress.value = {
      fullName: '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      province: '',
      postalCode: '',
      countryCode: 'IN',
      phoneNumber: phone || ''
    }
    if (useSameForBilling.value) {
      billingAddress.value = { ...shippingAddress.value }
    }
  }

  const handleSaveAddress = async () => {
    if (!canSaveAndContinue.value) {
      orderError.value = 'Please fill all required fields'
      return false
    }

    isSavingAddress.value = true
    orderError.value = null

    try {
      if (saveAddressToAccount.value && showShippingForm.value) {
        const saveResult = await saveCustomerAddress({ ...shippingAddress.value })
        if (!saveResult.success) {
          console.warn('Address not saved to account:', saveResult.error)
        }
      }

      const shippingResult = await setShippingAddress({ ...shippingAddress.value })
      if (!shippingResult?.success) {
        orderError.value = shippingResult?.error || 'Failed to save shipping address'
        return false
      }

      const methodsResult = await fetchEligibleShippingMethods()
      eligibleShippingMethods.value = methodsResult?.methods || []

      if (eligibleShippingMethods.value.length > 0) {
        await setShippingMethod(eligibleShippingMethods.value[0].id)
      }

      const billingInput = useSameForBilling.value 
        ? { ...shippingAddress.value } 
        : { ...billingAddress.value }
      
      const billingResult = await setBillingAddress(billingInput)
      if (!billingResult?.success) {
        orderError.value = billingResult?.error || 'Failed to save billing address'
        return false
      }

      await refreshSavedAddresses()
      currentStep.value = 2
      return true

    } catch (err) {
      orderError.value = err.message || 'Failed to save addresses'
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

  const handleRemoveCoupon = async () => {
    if (!couponCode.value) return
    const result = await removeCoupon(couponCode.value)
    if (result?.success) {
      couponCode.value = ''
      couponError.value = ''
    }
  }

  const handleProceedToPayment = async (openRazorpayCheckout) => {
    isPaymentProcessing.value = true

    if (!order.value?.shippingAddress || !order.value?.billingAddress) {
      orderError.value = 'Please complete shipping and billing details'
      isPaymentProcessing.value = false
      return false
    }

    try {
      await fetchActiveOrder()
      
      let currentState = order.value.state
      if (currentState !== 'ArrangingPayment') {
        // ✅ Cache order BEFORE state changes
        cachedOrderForPayment.value = {
          id: order.value.id,
          code: order.value.code,
          totalWithTax: order.value.totalWithTax,
          currencyCode: order.value.currencyCode,
          shippingAddress: { ...order.value.shippingAddress },
          billingAddress: { ...order.value.billingAddress },
          customer: { ...order.value.customer },
        }

        const transitionResult = await transitionOrderToState('ArrangingPayment')
        if (!transitionResult?.success) {
          orderError.value = 'Failed to prepare order for payment'
          cachedOrderForPayment.value = null
          isPaymentProcessing.value = false
          return false
        }
        await fetchActiveOrder()
      }

      const paymentResult = await addPaymentToOrder({
        method: 'razorpay-payment',
        // ✅ FIXED: Use order.value.id directly instead of undefined unsettledOrder
        metadata: { orderId: order.value.id }
      })

      if (!paymentResult?.success) {
        orderError.value = paymentResult?.error || 'Failed to create payment'
        cachedOrderForPayment.value = null
        isPaymentProcessing.value = false
        return false
      }

      const payment = paymentResult.order.payments?.find(p => p.method === 'razorpay-payment')
      const razorpayOrderId = payment?.metadata?.public?.razorpayOrderId
      
      if (!razorpayOrderId) {
        orderError.value = 'Failed to create Razorpay order'
        cachedOrderForPayment.value = null
        isPaymentProcessing.value = false
        return false
      }

      openRazorpayCheckout({
        razorpayOrderId,
        amount: Math.round(order.value.totalWithTax * 100),
        currency: order.value.currencyCode,
        customer: {
          fullName: order.value.shippingAddress?.fullName || '',
          emailAddress: order.value.customer?.emailAddress || '',
          phoneNumber: order.value.shippingAddress?.phoneNumber || '',
        },
        onSuccess: async (razorpayResponse) => {
          isPaymentProcessing.value = false
          console.log("RAZORPAY SUCCESS:", razorpayResponse)
          
          const verificationResult = await verifyRazorpayPayment(razorpayOrderId)
          console.log("Verification result:", verificationResult)
          
          if (verificationResult.success && verificationResult.paid) {
            const orderCode = cachedOrderForPayment.value?.code || order.value?.code
            cachedOrderForPayment.value = null
          
             router.push({ 
              name: 'order-success',
              query: { orderId: orderCode }
            })

            return true
          } else if (verificationResult.success && !verificationResult.paid) {
            paymentVerificationError.value = verificationResult.message || 'Payment verification pending'
            return false
          } else {
            paymentVerificationError.value = verificationResult.error || 'Payment verification failed'
            return false
          }
        },
        
        onFailure: async (razorpayError) => {
          isPaymentProcessing.value = false
          console.log("RAZORPAY FAILURE:", razorpayError)
          
          // ✅ Try verification even on failure (sometimes payment succeeds despite error)
          const verificationResult = await verifyRazorpayPayment(razorpayOrderId)

          if (verificationResult.success && verificationResult.paid) {
            const orderCode = cachedOrderForPayment.value?.code || order.value?.code
            cachedOrderForPayment.value = null
            
         
             router.push({ 
              name: 'order-success',
              query: { orderId: orderCode }
            })

            return false
          } else if (verificationResult.success && !verificationResult.paid) {
            paymentVerificationError.value = verificationResult.message || 'Payment verification pending'
            return false
          } else {
            // ✅ Show Razorpay error or verification error
            paymentVerificationError.value = (typeof razorpayError === 'string' 
              ? razorpayError 
              : razorpayError?.message) || verificationResult.error || 'Payment failed'
            return false
          }
        }
      })

      return true
    } catch (err) {
      console.error("PAYMENT ERROR:", err)
      orderError.value = err.message || 'Payment initiation failed'
      cachedOrderForPayment.value = null
      isPaymentProcessing.value = false
      return false
    }
  }

  return {
    activeOrder: order,
    isLoading,
    error: orderError,
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
    isPaymentProcessing,
    paymentVerificationError,
    cachedOrderForPayment,
    isRazorpayPaymentVerifying,

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
