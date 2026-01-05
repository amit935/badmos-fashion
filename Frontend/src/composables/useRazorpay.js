import { ref } from 'vue'
import { useAuthStore } from '../store/authStore'
import { VERIFY_RAZORPAY_PAYMENT } from '../api/queries'
import client from '../api/client'

export function useRazorpay() {
  const isProcessing = ref(false)
  const isPaymentVerifying = ref(false)
  const paymentError = ref(null)
  const authStore = useAuthStore()

  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_PUBLIC_KEY_ID

  const openRazorpayCheckout = ({ 
    razorpayOrderId, 
    amount, 
    currency = 'INR',
    customer,
    onSuccess,
    onFailure 
  }) => {
    isProcessing.value = true
    paymentError.value = null

    try {
      if (!window.Razorpay) {
        isProcessing.value = false
        paymentError.value = 'Razorpay SDK not loaded'
        onFailure?.(new Error('Razorpay SDK not loaded'))
        return
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Badmos Fashion',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        
        handler: function (response) {
          isProcessing.value = false
          onSuccess?.(response)
        },
        
        prefill: {
          name: customer?.fullName || authStore.user?.firstName || '',
          email: customer?.emailAddress || authStore.user?.emailAddress || '',
          contact: customer?.phoneNumber || authStore.user?.phoneNumber || '',
        },
        
        theme: {
          color: '#000000',
        },
        
        modal: {
          ondismiss: function() {
            isProcessing.value = false
            paymentError.value = 'Payment cancelled by user'
            onFailure?.(new Error('Payment cancelled'))
          }
        }
      }

      const rzp = new window.Razorpay(options)
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment Failed:', response.error)
        isProcessing.value = false
        paymentError.value = response.error.description || 'Payment failed'
        onFailure?.(response.error)
      })

      rzp.open()
      
    } catch (error) {
      console.error('Razorpay initialization error:', error)
      isProcessing.value = false
      paymentError.value = error.message || 'Payment initialization failed'
      onFailure?.(error)
    }
  }

  const clearError = () => {
    paymentError.value = null
  }

  const verifyRazorpayPayment = async (razorpayOrderId) => {
    isPaymentVerifying.value = true
    console.log(razorpayOrderId)
    try {
      const response = await client.request(VERIFY_RAZORPAY_PAYMENT, { razorpayOrderId })
      console.log(response)
      const data = response.verifyRazorpayOrder
      
      if (data.paid) {
        console.log('isprocessing', isPaymentVerifying.value)
        isPaymentVerifying.value = false
        return { success: true, paid: true, paymentId: data.paymentId }
      }
      isPaymentVerifying.value = false
      return { success: true, paid: false, message: `Order with razorpay order ID ${razorpayOrderId} is not paid. Kindly create an order again. If any amount is deducted, it will be refunded within 7 business days excluding holidays.`}
    } catch (err) {
      isPaymentVerifying.value = false
      return { success: false, error: 'Failed to verify Razorpay payment' }
    }
  }

  return {
    openRazorpayCheckout,
    verifyRazorpayPayment,
    isProcessing,
    isPaymentVerifying,
    paymentError,
    clearError,
  }
}
