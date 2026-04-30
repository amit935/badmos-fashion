import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class OneTimeCode extends VendureEntity {
    constructor(input?: DeepPartial<OneTimeCode>) {
        super(input);
    }

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column()
    code: string;

    @Column()
    expiresAt: Date;
}