import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateNewCancellationRequestEntity1765478148712 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "cancellation_request" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" integer NOT NULL, "orderLineId" integer NOT NULL, "requestType" character varying NOT NULL, "requestedQuantity" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "reason" text NOT NULL, "requestedBy" character varying, "adminNote" text, "id" SERIAL NOT NULL, CONSTRAINT "PK_d316fe703bae35f573e729cbe18" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" ADD CONSTRAINT "FK_48af3372be120cee9e37c27e513" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" ADD CONSTRAINT "FK_77638dfa0c9132d9cf3d51185ab" FOREIGN KEY ("orderLineId") REFERENCES "order_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "cancellation_request" DROP CONSTRAINT "FK_77638dfa0c9132d9cf3d51185ab"`, undefined);
        await queryRunner.query(`ALTER TABLE "cancellation_request" DROP CONSTRAINT "FK_48af3372be120cee9e37c27e513"`, undefined);
        await queryRunner.query(`DROP TABLE "cancellation_request"`, undefined);
   }

}
