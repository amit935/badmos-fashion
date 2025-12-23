import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsParentGroupFieldToProductOptionGroup1763365161424 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_option_group" ADD "customFieldsIsparentgroup" boolean DEFAULT false`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_option_group" DROP COLUMN "customFieldsIsparentgroup"`, undefined);
   }

}
