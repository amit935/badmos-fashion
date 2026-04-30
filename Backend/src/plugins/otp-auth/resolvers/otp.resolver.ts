import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { OtpService } from '../services/otp.service';
import gql from 'graphql-tag';

// Define schema extension
export const otpApiExtensions = gql`
  extend type Mutation {
    requestOtp(email: String!): Boolean!
  }
`;

@Resolver()
export class OtpResolver {
    constructor(private otpService: OtpService) {}

    @Mutation()
    async requestOtp(
        @Ctx() ctx: RequestContext, 
        @Args('email') email: string,
    ) {
        // 1. Generate Code (Simple 4 digit)
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        
        // 2. Save it
        await this.otpService.saveOtp(ctx, email, code);

        // 
        // 3. TODO: SEND EMAIL HERE
        // await this.emailService.sendOtp(email, code);
        console.log(`Sending OTP ${code} to ${email}`); 
        return true;
    }
}