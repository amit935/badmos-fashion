import {MigrationInterface, QueryRunner} from "typeorm";

export class AddComponentNameFieldToCollection1762461389169 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsComponentname" character varying(255)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsComponentname"`, undefined);
   }

}
