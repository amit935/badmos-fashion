import { gql } from 'graphql-request';
import { ACTIVE_ORDER_FRAGMENT } from './fragments';

export const REGISTER_CUSTOMER = gql`
  mutation Register($input: RegisterCustomerInput!) {
  registerCustomerAccount(input: $input) {
    ... on Success {
      __typename
      success
    }
    ...on ErrorResult {
      __typename
      errorCode
      message
    }
  }
}
`;

export const VERIFY_CUSTOMER_EMAIL = gql`
mutation Verify($token: String!) {
  verifyCustomerAccount(token: $token) {
    ...on CurrentUser {
      __typename
      id
      identifier
    }
    ...on ErrorResult {
      __typename
      errorCode
      message
    }
  }
}`;

export const RESEND_VERIFICATION_EMAIL = gql`
mutation ResendVerificationEmail($emailAddress: String!) {
  refreshCustomerVerification(emailAddress: $emailAddress) {
    ... on Success {
      __typename
      success
    }
    ...on NativeAuthStrategyError {
      __typename
      errorCode
      message
    }
  }
}`;

export const REQUEST_PASSWORD_RESET = gql`
 mutation RequestPasswordReset($emailAddress: String!) {
  requestPasswordReset(emailAddress: $emailAddress) {
    ... on Success {
      __typename
      success
  }
    ... on NativeAuthStrategyError {
      __typename
      errorCode
      message
    }
  }
}`;

export const RESET_PASSWORD = gql`
mutation ResetPassword($token: String!, $password: String!) {
  resetPassword(token: $token, password: $password) {
    ... on CurrentUser {

      id
      identifier
    }

    ... on NativeAuthStrategyError {
      errorCode
      message
    }

    ... on PasswordResetTokenInvalidError {
      errorCode
      message
    }

    ... on PasswordResetTokenExpiredError {
      errorCode
      message
    }

    ... on PasswordValidationError {
      errorCode
      message
    }

    ... on NotVerifiedError {
      errorCode
      message
    }
  }
}`

export const LOGIN_CUSTOMER = gql`
  mutation LogIn($emailAddress: String!, $password: String!, $rememberMe: Boolean!) {
  login(username: $emailAddress, password: $password, rememberMe: $rememberMe) {
    ... on  CurrentUser {
     __typename
      id
      identifier
    }
    ... on ErrorResult {
     __typename
      errorCode
      message
    }
  }
}
`;

export const SIGNOUT_CUSTOMER = gql`
  mutation LogOut {
  logout {
    success
  }
}`;

export const ADD_ITEM_TO_ORDER = gql`
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InsufficientStockError {
        quantityAvailable
        order {
          ...ActiveOrder
        }
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

export const REMOVE_ORDER_LINE = gql`
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

export const ADJUST_ORDER_LINE = gql`
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ...ActiveOrder
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InsufficientStockError {
        quantityAvailable
        order {
          ...ActiveOrder
        }
      }
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

// ============================================================================
// Address Management
// ============================================================================

export const SET_SHIPPING_ADDRESS = gql`
  mutation SetShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
      __typename
        id
        code
        shippingAddress {
          fullName
          company
          streetLine1
          streetLine2
          city
          province
          postalCode
          country
          phoneNumber
        }
      }
      ... on ErrorResult {
      __typename
        errorCode
        message
      }
    }
  }
`

export const SET_BILLING_ADDRESS = gql`
  mutation SetBillingAddress($input: CreateAddressInput!) {
    setOrderBillingAddress(input: $input) {
      ... on Order {
      __typename
        id
        code
        billingAddress {
          fullName
          company
          streetLine1
          streetLine2
          city
          province
          postalCode
          country
          phoneNumber
        }
      }
      ... on ErrorResult {
      __typename
        errorCode
        message
      }
    }
  }
`

export const SAVE_CUSTOMER_ADDRESS = gql`
  mutation SaveCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      fullName
      streetLine1
      streetLine2
      city
      province
      postalCode
      country {
        code
        name
      }
      phoneNumber
      defaultShippingAddress
      defaultBillingAddress
    }
  }
`




// ============================================================================
// Shipping Method
// ============================================================================

export const SET_SHIPPING_METHOD = gql`
  mutation SetShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
      __typename
        id
        code
        shipping
        shippingWithTax
        total
        totalWithTax
        shippingLines {
          shippingMethod {
            id
            name
            description
          }
          price
          priceWithTax
        }
      }
      ... on IneligibleShippingMethodError {
      __typename
        errorCode
        message
      }
      ... on NoActiveOrderError {
      __typename
        errorCode
        message
      }
      ... on OrderModificationError {
      __typename
        errorCode
        message
      }
    }
  }
`

// ============================================================================
// Coupon Codes
// ============================================================================

export const APPLY_COUPON_CODE = gql`
  mutation ApplyCouponCode($couponCode: String!) {
    applyCouponCode(couponCode: $couponCode) {
      ... on Order {
      __typename
        id
        code
        couponCodes
        discounts {
          description
          amount
          amountWithTax
        }
        subTotal
        subTotalWithTax
        total
        totalWithTax
      }
      ... on CouponCodeExpiredError {
      __typename
        errorCode
        message
        couponCode
      }
      ... on CouponCodeInvalidError {
      __typename
        errorCode
        message
        couponCode
      }
      ... on CouponCodeLimitError {
      __typename
        errorCode
        message
        couponCode
        limit
      }
    }
  }
`

export const REMOVE_COUPON_CODE = gql`
  mutation RemoveCouponCode($couponCode: String!) {
    removeCouponCode(couponCode: $couponCode) {
      ... on Order {
      __typename
        id
        code
        couponCodes
        discounts {
          description
          amount
          amountWithTax
        }
        subTotal
        subTotalWithTax
        total
        totalWithTax
      }
    }
  }
`

// ============================================================================
// Order State Transitions
// ============================================================================

export const TRANSITION_ORDER_TO_STATE = gql`
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
      __typename
        id
        code
        state
      }
      ... on OrderStateTransitionError {
      __typename
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

// ============================================================================
// Payment (for next step after checkout)
// ============================================================================

export const ADD_PAYMENT_TO_ORDER = gql`
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        __typename  
        id
        code
        state
        active
        payments {
          id
          method
          amount
          state
          transactionId
          metadata    # ← CRITICAL: Must include metadata
        }
      }
      ... on OrderPaymentStateError {
        __typename  
        errorCode
        message
      }
      ... on IneligiblePaymentMethodError {
        __typename  
        errorCode
        message
      }
      ... on PaymentFailedError {
        __typename  
        errorCode
        message
        paymentErrorMessage
      }
      ... on PaymentDeclinedError {
        __typename  
        errorCode
        message
        paymentErrorMessage
      }
      ... on OrderStateTransitionError {
        __typename  
        errorCode
        message
      }
      ... on NoActiveOrderError {
        __typename  
        errorCode
        message
      }
    }
  }
`

export const SETTLE_PAYMENT = gql`
  mutation SettlePayment($id: ID!) {
    settlePayment(id: $id) {
      ... on Payment {
      __typename
        id
        state
        amount
        method
        transactionId
        metadata
      }
      ... on SettlePaymentError {
      __typename
        errorCode
        message
        paymentErrorMessage
      }
      ... on PaymentStateTransitionError {
      __typename
        errorCode
        message
      }
      ... on OrderStateTransitionError {
      __typename
        errorCode
        message
      }
    }
  }
`;
// ============================================================================
// Cancellation Request
// ============================================================================

export const REQUEST_CANCELLATION = gql`
  mutation RequestCancellation(
    $orderCode: String!
    $orderLineId: ID!
    $quantity: Int!
    $reason: String!
    $requestType: String!
  ) {
    requestCancellation(
      orderCode: $orderCode
      orderLineId: $orderLineId
      quantity: $quantity
      reason: $reason
      requestType: $requestType
    ) {
      id
      createdAt
      updatedAt
      orderId
      orderLineId
      requestType
      requestedQuantity
      status
      reason
      requestedBy
      adminNote
    }
  }
`;

