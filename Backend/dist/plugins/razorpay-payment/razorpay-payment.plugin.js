"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayPlugin = void 0;
const core_1 = require("@vendure/core");
const razorpay_payment_handler_1 = require("./razorpay-payment.handler");
const razorpay_webhook_controller_1 = require("./razorpay-webhook.controller");
let RazorpayPlugin = class RazorpayPlugin {
};
exports.RazorpayPlugin = RazorpayPlugin;
exports.RazorpayPlugin = RazorpayPlugin = __decorate([
    (0, core_1.VendurePlugin)({
        imports: [core_1.PluginCommonModule],
        controllers: [razorpay_webhook_controller_1.RazorpayWebhookController],
        providers: [],
        configuration: config => {
            config.paymentOptions.paymentMethodHandlers.push(razorpay_payment_handler_1.razorpayPaymentHandler);
            return config;
        },
    })
], RazorpayPlugin);
