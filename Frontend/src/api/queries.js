import { gql } from 'graphql-request';
import { ACTIVE_ORDER_FRAGMENT } from '../api/fragments.js';

export const GET_ACTIVE_CUSTOMER = gql`
  query GetCustomer {
    activeCustomer {
      id
      title
      firstName
      lastName
      emailAddress
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
query GetProductById($id: ID!) {
  product(id: $id) {
    id
    slug
    name
    description
    featuredAsset {
      id
      preview
    }
    assets {
      id
      preview
    }
    optionGroups {
      id
      name
      code
      options {
        id
        name
        code
      }
    }
    variants {
      id
      name
      currencyCode
      price
      priceWithTax
      options {
        id
        name
        code
        groupId
        group {
          name
          code
        }
      }
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
    }
  }
}
`;

export const GET_PRODUCT_BY_SLUG = gql`
query GetProductBySlug($slug: String!) {
  product(slug: $slug) {
    id
    slug
    name
    description
    featuredAsset {
      id
      preview
    }
    assets {
      id
      preview
    }
    optionGroups {
      id
      name
      code
      customFields {
        isParentGroup
      }
      options {
        id
        name
        code
      }
    }
    variants {
      id
      name
      currencyCode
      price
      priceWithTax
      options {
        id
        name
        code
        groupId
        group {
          name
          code
          customFields {
            isParentGroup
          }
        }
      }
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
    }
  }
}
`

export const GET_COLLECTION_BY_SLUG = gql`
query GetCollection($slug: String!) {
  collection(slug: $slug) {
    id
    name
    slug
    description
    assets {
      id
      preview  
    }
    featuredAsset {
      id
      preview
    }
    customFields {
      externalLink
      isProductCollection
      componentName
    }
    children {
      id
      name
      slug
      description
      assets {
        id
        preview  
      }
      featuredAsset {
        id
        preview
      }
      customFields {
        externalLink
        isProductCollection
        componentName
      }
      children {
        id
        name
        slug
        description
        assets {
          id
          preview  
        }
        featuredAsset {
          id
          preview
        }
        customFields {
          externalLink
          isProductCollection
          componentName
        }
        children {
          id
          name
          slug
          description
          assets {
            id
            preview  
          }
          featuredAsset {
            id
            preview
          }
          customFields {
            externalLink
            isProductCollection
            componentName
          }
        }
      }
    }
  }
}
`

export const GET_COLLECTION_PRODUCTS = gql`
query GetCollectionProductIds($slug: String!, $skip: Int, $take: Int) {
  search(
    input: {
      collectionSlug: $slug
      groupByProduct: true
      skip: $skip
      take: $take
    }
  ) {
    totalItems
    items {
      productId
      productName
      slug
    }
  }
}
`

export const GET_ACTIVE_ORDER = gql`
  query GetActiveOrder {
    activeOrder {
      ...ActiveOrder
    }
  }
  ${ACTIVE_ORDER_FRAGMENT}
`;

// ============================================================================
// Customer Addresses
// ============================================================================

export const GET_CUSTOMER_ADDRESSES = gql`
  query GetCustomerAddresses {
    activeCustomer {
      id
      addresses {
        id
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          id
          code
          name
        }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
      }
    }
  }
`

// ============================================================================
// Shipping Methods
// ============================================================================

export const GET_ELIGIBLE_SHIPPING_METHODS = gql`
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      code
      description
      price
      priceWithTax
      metadata
    }
  }
`;

// ============================================================================
// Countries
// ============================================================================

export const GET_COUNTRIES = gql`
  query {
    availableCountries {
      code
      name
    }
  }
`;

// ============================================================================
// Orders
// ============================================================================

export const GET_ACTIVE_CUSTOMER_ORDERS = gql `
query GetActiveCustomerOrders($take: Int!, $skip: Int!) {
  activeCustomer {
    id
    orders(options: {
      filter: {
        state: {
          in: [
            "PaymentSettled",
            "Shipped",
            "PartiallyShipped", 
            "Delivered",
            "PartiallyDelivered",
            "Cancelled"
          ]
        }
      }
      sort: {
        orderPlacedAt: DESC
      }
      take: $take
      skip: $skip
    }) {
      items {
        id
        code
        state
        orderPlacedAt
        totalWithTax
        currencyCode
        lines {
          id
          productVariant {
            id
            name
          }
          quantity
          linePriceWithTax
        }
      }
      totalItems
    }
  }
}
`;

export const GET_ORDER_BY_CODE = gql`
  query OrderByCode($code: String!) {
    orderByCode(code: $code) {
      id
      createdAt
      updatedAt
      code
      type
      state
      active
      orderPlacedAt
      history { items { type data createdAt } }
      fulfillments {
        id
        state
        method
        lines {
          orderLine {
            id
            productVariant {
              id
              name
            }
            quantity
          }
        }
        trackingCode
        createdAt
        updatedAt
      }
      customer {
        id
        firstName
        lastName
        emailAddress
      }

      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        countryCode
      }

      billingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        countryCode
      }

      lines {
        id
        quantity
        orderPlacedQuantity
        productVariant {
          id
          name
          sku
          product {
            id
            name
          }
          featuredAsset {
            id
            preview
          }
        }
        unitPrice
        unitPriceWithTax
        discountedUnitPrice
        discountedUnitPriceWithTax
        linePrice
        linePriceWithTax
        discountedLinePrice
        discountedLinePriceWithTax
        taxLines {
          description
          taxRate
        }
      }

      surcharges {
        description
        sku
        price
        priceWithTax
        taxLines {
          description
          taxRate
        }
      }

      discounts {
        adjustmentSource
        amountWithTax
        type
      }

      couponCodes
      promotions {
        id
        name
        couponCode
      }

      payments {
        id
        
        method
        transactionId
        state
        amount
        errorMessage
        metadata
        refunds {
          id
          total
          reason
        }
      }

      fulfillments {
        id
        state
        method
        trackingCode
        lines {
          quantity
          orderLine {
            id
          }
        }
      }

      totalQuantity
      subTotal
      subTotalWithTax
      shipping
      shippingWithTax
      total
      totalWithTax
      currencyCode

      shippingLines {
        id
        shippingMethod {
          id
          name
        }
        discountedPrice
        discountedPriceWithTax
      }

      taxSummary {
        description
        taxBase
        taxTotal
        taxRate
      }
    }
  }
`;

export const VALIDATE_ORDER_CANCELLATION = gql`
  query ValidateOrderCancellation($code: String!) {
  validateOrderCancellation(orderCode: $code) {
    cancellable
    reason
  }
}
`;


export const ORDER_CANCELLATION_HISTORY = gql`
  query GetOrderCancellationRequests($orderCode: String!) {
  orderCancellationRequests(orderCode: $orderCode) {
    id
    orderId
    orderCode
    orderLineId
    requestType
    requestedQuantity
    status
    reason
    requestedBy
    adminNote
    createdAt
  }
}
`;

// ============================================================================
// Razorpay / Payment Gateway
// ============================================================================

export const VERIFY_RAZORPAY_PAYMENT = gql`
  query VerifyRazorpayOrder($razorpayOrderId: String!) {
  verifyRazorpayOrder(razorpayOrderId: $razorpayOrderId) {
    success
    paid
    paymentId
    razorpayOrderId
    error
  }
}
`