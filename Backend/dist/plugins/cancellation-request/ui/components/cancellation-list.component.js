"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationListComponent = void 0;
// @ts-nocheck
const core_1 = require("@angular/core");
const core_2 = require("@vendure/admin-ui/core");
const graphql_tag_1 = require("graphql-tag");
const GET_CANCELLATION_REQUESTS = (0, graphql_tag_1.gql) `
  query GetCancellationRequests($skip: Int, $take: Int) {
    cancellationRequests(skip: $skip, take: $take) {
      items {
        id
        orderId
        orderCode
        orderLineId
        requestType
        requestedQuantity
        status
        reason
        requestedBy
        createdAt
        adminNote
      }
      total
    }
  }
`;
const APPROVE_MUTATION = (0, graphql_tag_1.gql) `
  mutation ApproveCancellation($id: ID!, $adminNote: String) {
    approveCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`;
const REJECT_MUTATION = (0, graphql_tag_1.gql) `
  mutation RejectCancellation($id: ID!, $adminNote: String!) {
    rejectCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`;
let CancellationListComponent = class CancellationListComponent {
    constructor(dataService, notificationService) {
        this.dataService = dataService;
        this.notificationService = notificationService;
        this.items = [];
        this.totalItems = 0;
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }
    ngOnInit() {
        this.loadRequests();
    }
    loadRequests() {
        const skip = (this.currentPage - 1) * this.itemsPerPage;
        this.dataService
            .query(GET_CANCELLATION_REQUESTS, {
            skip,
            take: this.itemsPerPage,
        })
            .mapSingle((data) => data.cancellationRequests)
            .subscribe(result => {
            this.items = result.items;
            this.totalItems = result.total;
        }, error => {
            this.notificationService.error('Failed to load cancellation requests');
        });
    }
    onPageChange(page) {
        this.currentPage = page;
        this.loadRequests();
    }
    approve(id) {
        const adminNote = prompt('Add approval note (optional):');
        this.dataService
            .mutate(APPROVE_MUTATION, { id, adminNote })
            .subscribe(() => {
            this.notificationService.success('Cancellation request approved');
            this.loadRequests();
        }, error => {
            this.notificationService.error('Failed to approve request');
        });
    }
    reject(id) {
        const adminNote = prompt('Add rejection note (required):');
        if (!adminNote) {
            this.notificationService.error('Rejection note is required');
            return;
        }
        this.dataService
            .mutate(REJECT_MUTATION, { id, adminNote })
            .subscribe(() => {
            this.notificationService.success('Cancellation request rejected');
            this.loadRequests();
        }, error => {
            this.notificationService.error('Failed to reject request');
        });
    }
    getBadgeType(status) {
        switch (status) {
            case 'APPROVED':
                return 'success';
            case 'REJECTED':
                return 'error';
            default:
                return 'warning';
        }
    }
};
exports.CancellationListComponent = CancellationListComponent;
exports.CancellationListComponent = CancellationListComponent = __decorate([
    (0, core_1.Component)({
        selector: 'cancellation-list',
        standalone: true,
        imports: [core_2.SharedModule],
        template: `
    <vdr-page-block>
      <vdr-action-bar>
        <vdr-ab-left>
          <h2>Cancellation Requests</h2>
        </vdr-ab-left>
      </vdr-action-bar>
    </vdr-page-block>


    <vdr-data-table
      [items]="items"
      [itemsPerPage]="itemsPerPage"
      [totalItems]="totalItems"
      [currentPage]="currentPage"
      (pageChange)="onPageChange($event)"
    >
      <vdr-dt-column>ID</vdr-dt-column>
      <vdr-dt-column>Order Code</vdr-dt-column>
      <vdr-dt-column>Customer</vdr-dt-column>
      <vdr-dt-column>Quantity</vdr-dt-column>
      <vdr-dt-column>Status</vdr-dt-column>
      <vdr-dt-column>Reason</vdr-dt-column>
      <vdr-dt-column>Date</vdr-dt-column>
      <vdr-dt-column>Actions</vdr-dt-column>


      <ng-template let-item="item">
        <td class="left align-middle">{{ item.id }}</td>
        <td class="left align-middle">
          <a [routerLink]="['/orders', item.orderId]">{{ item.orderCode }}</a>
        </td>
        <td class="left align-middle">{{ item.requestedBy }}</td>
        <td class="left align-middle">{{ item.requestedQuantity }}</td>
        <td class="left align-middle">
          <vdr-badge [type]="getBadgeType(item.status)">{{ item.status }}</vdr-badge>
        </td>
        <td class="left align-middle">{{ item.reason }}</td>
        <td class="left align-middle">{{ item.createdAt | date: 'short' }}</td>
        <td class="left align-middle">
          <div *ngIf="item.status === 'PENDING'" class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-success"
              (click)="approve(item.id)"
            >
              ✓ Approve
            </button>
            <button
              type="button"
              class="btn btn-sm btn-danger"
              (click)="reject(item.id)"
            >
              ✗ Reject
            </button>
          </div>
          <span *ngIf="item.status !== 'PENDING'" class="text-muted">
            {{ item.adminNote || 'No action' }}
          </span>
        </td>
      </ng-template>
    </vdr-data-table>
  `,
        styles: [
            `
      .flex {
        display: flex;
      }
      .gap-2 {
        gap: 0.5rem;
      }
    `,
        ],
    }),
    __metadata("design:paramtypes", [core_2.DataService,
        core_2.NotificationService])
], CancellationListComponent);
