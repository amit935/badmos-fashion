import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAddOtpTable1769861353310 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "one_time_code" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "id" SERIAL NOT NULL, CONSTRAINT "PK_9fa97786ad11230e9563879e5bd" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customFieldsRazorpayorderid"`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order" ADD "customFieldsRazorpayorderid" character varying(255)`, undefined);
        await queryRunner.query(`DROP TABLE "one_time_code"`, undefined);
   }

}
