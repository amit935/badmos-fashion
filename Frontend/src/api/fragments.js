import { gql } from 'graphql-request';

export const ACTIVE_ORDER_FRAGMENT = gql`
fragment ActiveOrder on Order {
  __typename
  id
  code
  couponCodes
  state
  currencyCode
  totalQuantity
  subTotal
  subTotalWithTax
  shipping
  shippingWithTax
  total
  totalWithTax
  
  taxSummary {
    description
    taxRate
    taxTotal
  }
  discounts {
    description
    amount
    amountWithTax
  }
  lines {
    id
    unitPrice
    unitPriceWithTax
    quantity
    linePrice
    linePriceWithTax
    taxRate
    proratedUnitPrice
    proratedUnitPriceWithTax
    taxLines {
      description
      taxRate
    }
    productVariant {
      id
      name
      sku
      taxCategory {
        id
        name
      }
      featuredAsset {
        id
        preview
      }
    }
  }
  shippingLines {
    shippingMethod {
      id
      code
      name
      description
    }
    price
    priceWithTax
  }
  shippingAddress {
    fullName
    company
    streetLine1
    streetLine2
    city
    province
    postalCode
    phoneNumber
  }
  billingAddress {
    fullName
    company
    streetLine1
    streetLine2
    city
    province
    postalCode
    phoneNumber
    country
  }
}

`;
