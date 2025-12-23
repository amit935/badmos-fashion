import { ref } from 'vue'
import { useAuthStore } from '../store/authStore'

export function useRazorpay() {
  const isProcessing = ref(false)
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
    if (!window.Razorpay) {
      paymentError.value = 'Razorpay SDK not loaded'
      return
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount, // Amount in paise
      currency: currency,
      name: 'Badmos Fashion',
      description: 'Order Payment',
      order_id: razorpayOrderId,
      
      handler: function (response) {
        // Payment successful
        console.log('Payment Success:', response)
        if (onSuccess) {
          onSuccess(response)
        }
      },
      
      prefill: {
        name: customer?.fullName || authStore.user?.firstName || '',
        email: customer?.emailAddress || authStore.user?.emailAddress || '',
        contact: customer?.phoneNumber || authStore.user?.phoneNumber || '',
      },
      
      theme: {
        color: '#000000', // Your brand color
      },
      
      modal: {
        ondismiss: function() {
          // User closed the payment modal
          paymentError.value = 'Payment cancelled by user'
          if (onFailure) {
            onFailure(new Error('Payment cancelled'))
          }
        }
      }
    }

    const rzp = new window.Razorpay(options)
    
    rzp.on('payment.failed', function (response) {
      // Payment failed
      console.error('Payment Failed:', response.error)
      paymentError.value = response.error.description || 'Payment failed'
      if (onFailure) {
        onFailure(response.error)
      }
    })

    rzp.open()
  }

  return {
    openRazorpayCheckout,
    isProcessing,
    paymentError,
  }
}
