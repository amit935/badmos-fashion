import { createI18n } from 'vue-i18n'

const currentYear = new Date().getFullYear()

const messages = {
  en: {
    footer: {
        copyright: `Copyright © ${currentYear} Badmos Fashion. All rights reserved.`
    },

    auth: {
        login: {
          title: `Badmos Login`,
          altTitle: `Login`,
          caption: `If you are a Badmos, sign in with your email address.`,
          buttonText: `Login to badmos.store`,
          redirectText: `Not yet a Badmos?`,
          redirectLinkText: `Become Badmos`,
        },
        register: {
          title: `Become Badmos`,
          altTitle: `Register`,
          caption: `If you aren't already a Badmos, create your account.`,
          buttonText: `Join the badmos gang`,
          redirectText: `Already a Badmos?`,
          redirectLinkText: `Login here`,
          passwordRules: {
            minLength: 'At least 8 characters',
            number: 'At least one number',
            specialChar: 'At least one special character',
            lowercase: 'At least one lowercase letter',
            uppercase: 'At least one uppercase letter',
          },
          errorMessages: {
            emailInvalid: 'Please enter a valid email address.',
            emailRequired: 'Email is required.',
            passwordRequired: 'Password is required.',
            confirmPassword: 'Passwords must match.',
            confirmPasswordRequired: 'Please confirm your password.',
            nameRequired: 'Name is required.',
          },
          emailVerification: {
            title: `Verify Your Email Address`,
            message: `A verification link has been sent to you at {email}. Please check your inbox or spam and click on the Verify Email button to activate your account.`,
            resend: `Resend`,
            error: {
              title: `Verification Failed`,
            }
          }
        },
        resetPassword: {
        title: `Forgot Password?`,
        caption: `Enter your email and we'll send you a reset link.`,
        sendLink: `Send Reset Link`,
        newPasswordTitle: `Reset Password`,
        newPasswordCaption: `Enter your new password below.`,
        emailRequired: `Email is required`,
        emailInvalid: `Please enter a valid email`,
        passwordTooShort: `Password must be at least 8 characters`,
        passwordsMismatch: `Passwords do not match`,
        buttonText: `Reset Password`,
        sending: `Resetting...`,
        backToLogin: `Remember your password?`,
        loginLink: `Sign in`,
        successMessage: `Reset link sent! Check your inbox or spam.`,
        },
        profileDropdown: {
          title: `Welcome,`,
        }
    },

    guest: {
      profileDropdown: {
        title: `Welcome, Badmos.`,
      }
    },

    

    pageNotFound: {
        message: `Sorry Badmos, you seem to have chosen a wrong path.`      
    }
  },
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages
})

export default i18n
