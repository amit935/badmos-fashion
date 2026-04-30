import { Injectable } from '@nestjs/common';
import { 
    TransactionalConnection, 
    CustomerService, 
    RequestContext, 
    User,
    Customer
} from '@vendure/core';
import { OneTimeCode } from '../entities/otp.entity';
import { EventBus } from '@vendure/core';
import { OtpRequestedEvent } from '../events/otp-requested.event';

@Injectable()
export class OtpService {
    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private eventBus: EventBus
    ) {}

   async saveOtp(ctx: RequestContext, email: string, code: string) {
    const otpRepository = this.connection.getRepository(ctx, OneTimeCode);

    // 1. Fetch the existing record for this email
    const existingOtp = await otpRepository.findOne({ 
        where: { email },
        order: { createdAt: 'DESC' } // Ensure we get the latest if multiple exist
    });

    if (existingOtp) {
        const now = new Date();
        const lastCreated = new Date(existingOtp.createdAt);
        
        // Calculate difference in milliseconds
        const diffInMs = now.getTime() - lastCreated.getTime();
        const oneMinuteInMs = 60 * 1000;

        // 2. Logic Gate: Check if 1 minute has passed
        if (diffInMs < oneMinuteInMs) {
            const secondsRemaining = Math.ceil((oneMinuteInMs - diffInMs) / 1000);
            
            // Throwing a standard Error here. 
            // In a production Vendure plugin, you'd ideally throw a CustomError 
            // that returns a specific errorCode to the frontend.
            throw new Error(`Please wait ${secondsRemaining} seconds before requesting a new code.`);
        }

        // 3. Clear the old code only if the limit has passed
        await otpRepository.delete({ email });
    }

    // 4. Create and save new code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const entry = new OneTimeCode({ 
        email, 
        code, 
        expiresAt,
    });

    await otpRepository.save(entry);
    this.eventBus.publish(new OtpRequestedEvent(ctx, email, code));
}

    async isValidOtp(email: string, code: string): Promise<boolean> {
        const entry = await this.connection
            .getRepository(OneTimeCode)
            .findOne({ where: { email } });

        if (!entry) return false;
        
        if (entry.code === code && entry.expiresAt > new Date()) {
            // Consume code so it can't be used twice
            await this.connection.getRepository(OneTimeCode).remove(entry);
            return true;
        }
        return false;
    }

    async findOrCreateUser(ctx: RequestContext, email: string) {
        // FIX 1: Direct DB Lookup (Works on ALL Vendure versions)
        const existingCustomer = await this.connection
            .getRepository(ctx, Customer)
            .findOne({ 
                where: { emailAddress: email },
                relations: ['user'] 
            });
        
        if (existingCustomer) {
            if (!existingCustomer.user) {
                 throw new Error('Customer found but has no User entity.');
            }
            return existingCustomer.user;
        }

        // FIX 2: Handle Creation & Error Union Types
        const result = await this.customerService.create(ctx, {
            emailAddress: email,
            firstName: '',
            lastName: '',
        });

        // SAFETY CHECK: Does the result have an errorCode?
        // This handles "EmailAddressConflictError" and others safely without needing specific imports
        if ((result as any).errorCode) {
            throw new Error((result as any).message || 'Failed to create customer');
        }

        // TypeScript now knows this is a Customer
        const newCustomer = result as Customer;

        if (!newCustomer.user) {
             throw new Error('Customer created but no User entity attached.');
        }

        // Set verified = true
        newCustomer.user.verified = true;
        await this.connection.getRepository(ctx, User).save(newCustomer.user);

        return newCustomer.user;
    }
}