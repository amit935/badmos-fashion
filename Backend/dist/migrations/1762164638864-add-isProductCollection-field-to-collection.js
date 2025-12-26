"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIsProductCollectionFieldToCollection1762164638864 = void 0;
class AddIsProductCollectionFieldToCollection1762164638864 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" RENAME COLUMN "customFieldsHtmlcontent" TO "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsIsproductcollection" boolean DEFAULT true`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsIsproductcollection"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsIsproductcollection" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" RENAME COLUMN "customFieldsIsproductcollection" TO "customFieldsHtmlcontent"`, undefined);
    }
}
exports.AddIsProductCollectionFieldToCollection1762164638864 = AddIsProductCollectionFieldToCollection1762164638864;
