"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CancellationRequestPlugin_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationRequestPlugin = void 0;
const path_1 = __importDefault(require("path"));
const core_1 = require("@vendure/core");
const typeorm_1 = require("@nestjs/typeorm");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const cancellation_request_entity_1 = require("./entities/cancellation-request.entity");
const cancellation_request_service_1 = require("./services/cancellation-request.service");
const admin_resolver_1 = require("./resolvers/admin.resolver");
const shop_resolver_1 = require("./resolvers/shop.resolver");
const adminSchema = (0, graphql_tag_1.default) `
  type CancellationRequest implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    orderId: String!
    orderCode: String!
    orderLineId: ID!
    requestType: String!
    requestedQuantity: Int!
    status: String!
    reason: String!
    requestedBy: String
    adminNote: String
  }

  type CancellationRequestList {
    items: [CancellationRequest!]!
    total: Int!
  }

  extend type Query {
    cancellationRequests(skip: Int, take: Int): CancellationRequestList!
    cancellationRequest(id: ID!): CancellationRequest
    orderCancellationRequests(orderId: ID!): [CancellationRequest!]!
  }

  extend type Mutation {
    approveCancellationRequest(id: ID!, adminNote: String): CancellationRequest!
    rejectCancellationRequest(id: ID!, adminNote: String!): CancellationRequest!
    deleteCancellationRequest(id: ID!): Boolean!
  }
`;
const shopSchema = (0, graphql_tag_1.default) `
  type CancellationRequest implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    orderId: String!
    orderCode: String!
    orderLineId: ID!
    requestType: String!
    requestedQuantity: Int!
    status: String!
    reason: String!
    requestedBy: String
    adminNote: String
  }

  type CancellationValidationResult {
    cancellable: Boolean!
    reason: String
  }

  extend type Query {
    validateOrderCancellation(orderCode: String!): CancellationValidationResult!
  }

  extend type Query {
    orderCancellationRequests(orderCode: String!): [CancellationRequest!]!
  }

  extend type Mutation {
    requestCancellation(
      orderCode: String!
      orderLineId: ID!
      quantity: Int!
      reason: String!
      requestType: String!
    ): CancellationRequest!
  }
`;
let CancellationRequestPlugin = CancellationRequestPlugin_1 = class CancellationRequestPlugin {
    static init(options) {
        this.options = { ...this.options, ...options };
        return CancellationRequestPlugin_1;
    }
};
exports.CancellationRequestPlugin = CancellationRequestPlugin;
CancellationRequestPlugin.options = {
    earlyCancellationHours: 4,
    postDeliveryCancellationDays: 2,
};
// ✅ THIS IS THE CORRECT PROPERTY NAME
CancellationRequestPlugin.ui = {
    id: 'cancellation-request',
    extensionPath: path_1.default.join(__dirname, 'ui'),
    routes: [{ route: 'cancellation-requests', filePath: 'routes.ts' }],
    providers: ['providers.ts'],
};
exports.CancellationRequestPlugin = CancellationRequestPlugin = CancellationRequestPlugin_1 = __decorate([
    (0, core_1.VendurePlugin)({
        imports: [core_1.PluginCommonModule, typeorm_1.TypeOrmModule.forFeature([cancellation_request_entity_1.CancellationRequest])],
        entities: [cancellation_request_entity_1.CancellationRequest],
        providers: [cancellation_request_service_1.CancellationRequestService],
        adminApiExtensions: {
            schema: adminSchema,
            resolvers: [admin_resolver_1.AdminCancellationRequestResolver],
        },
        shopApiExtensions: {
            schema: shopSchema,
            resolvers: [shop_resolver_1.ShopCancellationRequestResolver],
        },
    })
], CancellationRequestPlugin);
