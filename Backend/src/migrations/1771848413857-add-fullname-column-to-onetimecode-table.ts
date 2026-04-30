import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFullnameColumnToOnetimecodeTable1771848413857 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "one_time_code" ADD "fullName" character varying NULL`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "one_time_code" DROP COLUMN "fullName"`, undefined);
   }

}
