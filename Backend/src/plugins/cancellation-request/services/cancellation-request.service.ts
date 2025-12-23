import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ID, RequestContext } from '@vendure/core';
import { CancellationRequest } from '../entities/cancellation-request.entity';

@Injectable()
export class CancellationRequestService {
  constructor(
    @InjectRepository(CancellationRequest)
    private readonly repo: Repository<CancellationRequest>,
  ) {}

  async create(
    ctx: RequestContext,
    input: {
      orderId: string;
      orderCode: string;
      orderLineId: string;
      requestType: 'FULL' | 'PARTIAL';
      requestedQuantity: number;
      reason: string;
      requestedBy?: string;
    },
  ): Promise<CancellationRequest> {
    const req = this.repo.create({
      ...input,
      status: 'PENDING',
    });
    return this.repo.save(req);
  }

  async findAll(
    ctx: RequestContext,
    skip = 0,
    take = 20,
  ): Promise<{ items: CancellationRequest[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async findById(ctx: RequestContext, id: string): Promise<CancellationRequest | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByOrderId(ctx: RequestContext, orderId: string): Promise<CancellationRequest[]> {
    return this.repo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderCode(ctx: RequestContext, orderCode: string): Promise<CancellationRequest[]> {
    return this.repo.find({
      where: { orderCode },
      relations: ['order', 'orderLine'],
      order: { createdAt: 'DESC' },
    });
  }

  async approve(
    ctx: RequestContext,
    id: string,
    adminNote?: string,
  ): Promise<CancellationRequest> {
    const req = await this.findById(ctx, id);
    if (!req) {
      throw new Error(`CancellationRequest ${id} not found`);
    }
    req.status = 'APPROVED';
    if (adminNote) req.adminNote = adminNote;
    return this.repo.save(req);
  }

  async reject(
    ctx: RequestContext,
    id: string,
    adminNote: string,
  ): Promise<CancellationRequest> {
    const req = await this.findById(ctx, id);
    if (!req) {
      throw new Error(`CancellationRequest ${id} not found`);
    }
    req.status = 'REJECTED';
    req.adminNote = adminNote;
    return this.repo.save(req);
  }

  async delete(ctx: RequestContext, id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return !!result.affected && result.affected > 0;
  }
}
