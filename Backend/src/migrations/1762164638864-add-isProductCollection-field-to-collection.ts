import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsProductCollectionFieldToCollection1762164638864 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" RENAME COLUMN "customFieldsHtmlcontent" TO "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsIsproductcollection" boolean DEFAULT true`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsIsproductcollection" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" RENAME COLUMN "customFieldsIsproductcollection" TO "customFieldsHtmlcontent"`, undefined);
   }

}
