import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order, OrderLine, VendureEntity, EntityId, ID, DeepPartial } from '@vendure/core';

export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CancellationRequestType = 'FULL' | 'PARTIAL';

@Entity()
export class CancellationRequest extends VendureEntity {
  constructor(input?: DeepPartial<CancellationRequest>) {
    super(input);
  }

  @Column()
  orderId!: string;
  
  @Column()
  orderCode!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order!: Order;

  @Column()
  orderLineId!: string;

  @ManyToOne(() => OrderLine, { onDelete: 'CASCADE' })
  orderLine!: OrderLine;

  @Column({ type: 'varchar' })
  requestType!: CancellationRequestType;

  @Column()
  requestedQuantity!: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: CancellationRequestStatus;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ nullable: true })
  requestedBy?: string;

  @Column({ type: 'text', nullable: true })
  adminNote?: string;
}
