import { AuthenticationStrategy, Injector, RequestContext, User } from '@vendure/core';
import gql from 'graphql-tag';
import { OtpService } from './services/otp.service';

export class EmailOtpStrategy implements AuthenticationStrategy<{ email: string; code: string }> {
    readonly name = 'emailOtp';
    private otpService: OtpService;

    init(injector: Injector) {
        // We inject our service here because Strategies are not NestJS providers
        this.otpService = injector.get(OtpService);
    }

    defineInputType() {
        // This defines the GraphQL input for 'authenticate'
        return gql`
            input EmailOtpInput {
                email: String!
                code: String!
            }
        `;
    }

    async authenticate(ctx: RequestContext, data: { email: string; code: string }): Promise<User | false | string> {
        // 1. Validate Code
        const isValid = await this.otpService.isValidOtp(data.email, data.code);
        if (!isValid) {
            return 'Invalid or expired OTP';
        }

        // 2. Find or Create User
        // This handles the "Registration" part automatically
        const user = await this.otpService.findOrCreateUser(ctx, data.email);
        
        return user;
    }
}