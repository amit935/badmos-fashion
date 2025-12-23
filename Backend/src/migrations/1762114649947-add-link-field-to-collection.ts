import {MigrationInterface, QueryRunner} from "typeorm";

export class AddLinkFieldToCollection1762114649947 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsExternallink" character varying(255)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsExternallink"`, undefined);
   }

}
