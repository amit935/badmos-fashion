"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIsParentGroupFieldToProductOptionGroup1763365161424 = void 0;
class AddIsParentGroupFieldToProductOptionGroup1763365161424 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "product_option_group" ADD "customFieldsIsparentgroup" boolean DEFAULT false`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "product_option_group" DROP COLUMN "customFieldsIsparentgroup"`, undefined);
    }
}
exports.AddIsParentGroupFieldToProductOptionGroup1763365161424 = AddIsParentGroupFieldToProductOptionGroup1763365161424;
