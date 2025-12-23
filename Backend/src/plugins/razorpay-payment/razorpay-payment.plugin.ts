import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { razorpayPaymentHandler } from './razorpay-payment.handler';
import { RazorpayWebhookController } from './razorpay-webhook.controller';

@VendurePlugin({
  imports: [PluginCommonModule],
  controllers: [RazorpayWebhookController],
  providers: [],
  configuration: config => {
    config.paymentOptions.paymentMethodHandlers.push(razorpayPaymentHandler);
    return config;
  },
})
export class RazorpayPlugin {}
