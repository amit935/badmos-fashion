import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { OneTimeCode } from './entities/otp.entity';
import { OtpService } from './services/otp.service';
import { OtpResolver, otpApiExtensions } from './resolvers/otp.resolver';
import { EmailOtpStrategy } from './otp-strategy';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [OneTimeCode], // Registers the database table
    providers: [
        OtpService, 
        EmailOtpStrategy // Strategy must be a provider to use dependency injection
    ], 
    shopApiExtensions: {
        schema: otpApiExtensions, // Adds 'requestOtp' to the API
        resolvers: [OtpResolver],
    },
    configuration: config => {
        // This hooks our strategy into Vendure's auth system
        config.authOptions.shopAuthenticationStrategy.push(new EmailOtpStrategy());
        return config;
    }
})
export class OtpAuthPlugin {}