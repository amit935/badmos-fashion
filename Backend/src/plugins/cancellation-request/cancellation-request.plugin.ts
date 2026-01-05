  import path from 'path';
  import { PluginCommonModule, VendurePlugin } from '@vendure/core';
  import { AdminUiExtension } from '@vendure/ui-devkit/compiler';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import gql from 'graphql-tag';
  import { CancellationRequest } from './entities/cancellation-request.entity';
  import { CancellationRequestService } from './services/cancellation-request.service';
  import { AdminCancellationRequestResolver } from './resolvers/admin.resolver';
  import { ShopCancellationRequestResolver } from './resolvers/shop.resolver';

  export interface CancellationRequestPluginOptions {
    earlyCancellationHours?: number;
    postDeliveryCancellationDays?: number;
  }

  const adminSchema = gql`
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

  const shopSchema = gql`
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

  @VendurePlugin({
    imports: [PluginCommonModule, TypeOrmModule.forFeature([CancellationRequest])],
    entities: [CancellationRequest],
    providers: [CancellationRequestService],
    adminApiExtensions: {
      schema: adminSchema,
      resolvers: [AdminCancellationRequestResolver],
    },
    shopApiExtensions: {
      schema: shopSchema,
      resolvers: [ShopCancellationRequestResolver],
    },
  })
  export class CancellationRequestPlugin {
    static options: CancellationRequestPluginOptions = {
      earlyCancellationHours: 4,
      postDeliveryCancellationDays: 2,
    };

    static init(options: CancellationRequestPluginOptions) {
      this.options = { ...this.options, ...options };
      return CancellationRequestPlugin;
    }

    // ✅ THIS IS THE CORRECT PROPERTY NAME
    static ui: AdminUiExtension = {
      id: 'cancellation-request',
      extensionPath: path.join(__dirname, 'ui'),
      routes: [{ route: 'cancellation-requests', filePath: 'routes.ts' }],
      providers: ['providers.ts'],
    };
  }
