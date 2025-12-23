import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOrderCodeFieldToCancellationRequestsTable1766083510465 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        // 1. Add orderCode as nullable first
        await queryRunner.query(`ALTER TABLE "cancellation_request" ADD "orderCode" character varying`, undefined);
        
        // 2. Populate existing rows with order codes
        await queryRunner.query(`
            UPDATE "cancellation_request" cr 
            SET "orderCode" = o.code 
            FROM "order" o 
            WHERE cr."orderId" = o.id
        `, undefined);
        
        // 3. Now make orderCode NOT NULL
        await queryRunner.query(`ALTER TABLE "cancellation_request" ALTER COLUMN "orderCode" SET NOT NULL`, undefined);
        
        // 4. Drop FK constraint
        await queryRunner.query(`ALTER TABLE "cancellation_request" DROP CONSTRAINT "FK_48af3372be120cee9e37c27e513"`, undefined);
        
        // 5. Make orderId nullable
        await queryRunner.query(`ALTER TABLE "cancellation_request" ALTER COLUMN "orderId" DROP NOT NULL`, undefined);
        
        // 6. Re-add FK constraint
        await queryRunner.query(`ALTER TABLE "cancellation_request" ADD CONSTRAINT "FK_48af3372be120cee9e37c27e513" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "cancellation_request" DROP CONSTRAINT "FK_48af3372be120cee9e37c27e513"`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" ALTER COLUMN "orderId" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" ADD CONSTRAINT "FK_48af3372be120cee9e37c27e513" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" DROP COLUMN "orderCode"`, undefined);
   }
}
