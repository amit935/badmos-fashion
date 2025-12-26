"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddComponentNameFieldToCollection1762461389169 = void 0;
class AddComponentNameFieldToCollection1762461389169 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" ADD "customFieldsComponentname" character varying(255)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "customFieldsComponentname"`, undefined);
    }
}
exports.AddComponentNameFieldToCollection1762461389169 = AddComponentNameFieldToCollection1762461389169;
