"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRazorpayOrderIdCustomFieldInOrders1763918139190 = void 0;
class AddRazorpayOrderIdCustomFieldInOrders1763918139190 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "order" ADD "customFieldsRazorpayorderid" character varying(255)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customFieldsRazorpayorderid"`, undefined);
    }
}
exports.AddRazorpayOrderIdCustomFieldInOrders1763918139190 = AddRazorpayOrderIdCustomFieldInOrders1763918139190;
