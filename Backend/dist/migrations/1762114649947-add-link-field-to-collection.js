"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLinkFieldToCollection1762114649947 = void 0;
class AddLinkFieldToCollection1762114649947 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsExternallink" character varying(255)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsExternallink"`, undefined);
    }
}
exports.AddLinkFieldToCollection1762114649947 = AddLinkFieldToCollection1762114649947;
