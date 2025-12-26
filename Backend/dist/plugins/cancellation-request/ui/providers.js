"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@vendure/admin-ui/core");
exports.default = [
    (0, core_1.addNavMenuSection)({
        id: 'cancellation-requests',
        label: 'Cancellations',
        items: [{
                id: 'cancellation-list',
                label: 'Cancellation Requests',
                routerLink: ['/extensions/cancellation-requests'],
                icon: 'close-circle',
            }],
    }, 'orders'), // Adds it after the "orders" section
];
