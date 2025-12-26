"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@vendure/admin-ui/core");
const cancellation_list_component_1 = require("./components/cancellation-list.component");
exports.default = [
    (0, core_1.registerRouteComponent)({
        component: cancellation_list_component_1.CancellationListComponent,
        path: '',
        title: 'Cancellation Requests',
        breadcrumb: 'Cancellation Requests',
    }),
];
