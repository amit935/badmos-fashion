import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Ctx, Allow, Permission, RequestContext } from '@vendure/core';
import { CancellationRequestService } from '../services/cancellation-request.service';

@Resolver()
export class AdminCancellationRequestResolver {
  constructor(private readonly service: CancellationRequestService) {}

  @Query()
  @Allow(Permission.ReadOrder)
  async cancellationRequests(
    @Ctx() ctx: RequestContext,
    @Args('skip') skip: number,
    @Args('take') take: number,
  ) {
    return this.service.findAll(ctx, skip, take);
  }

  @Query()
  @Allow(Permission.ReadOrder)
  async cancellationRequest(@Ctx() ctx: RequestContext, @Args('id') id: string) {
    return this.service.findById(ctx, id);
  }

  @Query()
  @Allow(Permission.ReadOrder)
  async orderCancellationRequests(
    @Ctx() ctx: RequestContext,
    @Args('orderCode') orderCode: string,  // ✅ Fixed
  ) {
    return this.service.findByOrderCode(ctx, orderCode);  // ✅ Fixed
  }

  @Mutation()
  @Allow(Permission.UpdateOrder)
  async approveCancellationRequest(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
    @Args('adminNote', { nullable: true }) adminNote?: string,
  ) {
    return this.service.approve(ctx, id, adminNote);
  }

  @Mutation()
  @Allow(Permission.UpdateOrder)
  async rejectCancellationRequest(
    @Ctx() ctx: RequestContext,
    @Args('id') id: string,
    @Args('adminNote') adminNote: string,
  ) {
    return this.service.reject(ctx, id, adminNote);
  }

  @Mutation()
  @Allow(Permission.DeleteOrder)
  async deleteCancellationRequest(@Ctx() ctx: RequestContext, @Args('id') id: string) {
    return this.service.delete(ctx, id);
  }
}
