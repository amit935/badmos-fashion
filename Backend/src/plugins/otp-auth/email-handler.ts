import { EmailEventListener } from '@vendure/email-plugin';
import { OtpRequestedEvent } from '../otp-auth/events/otp-requested.event';

export const otpEmailHandler = new EmailEventListener('otp-auth')
    .on(OtpRequestedEvent)
    .setRecipient(event => event.emailAddress)
    .setFrom('{{ fromAddress }}')
    .setSubject('Your Badmos Fashion Verification Code: {{ otpCode }}')
    .setTemplateVars(event => ({
        otpCode: event.otpCode,
        emailAddress: event.emailAddress
    }));