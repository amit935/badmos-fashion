import { VendureEvent, RequestContext } from '@vendure/core';

export class OtpRequestedEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public emailAddress: string,
        public otpCode: string,
    ) {
        super();
    }
}