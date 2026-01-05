import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';
import { razorpayPaymentHandler } from './razorpay-payment.handler';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayShopResolver } from './resolvers/shop.resolver';

const shopSchema = gql`
  type RazorpayVerificationResult {
    success: Boolean!
    paid: Boolean!
    paymentId: String
    razorpayOrderId: String
    error: String
  }

  extend type Query {
    verifyRazorpayOrder(razorpayOrderId: String!): RazorpayVerificationResult!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [RazorpayWebhookController],
  providers: [],
  configuration: config => {
    config.paymentOptions.paymentMethodHandlers.push(razorpayPaymentHandler);
    return config;
  },
  shopApiExtensions: {
    schema: shopSchema,
    resolvers: [RazorpayShopResolver],
  }
})
export class RazorpayPlugin {}
