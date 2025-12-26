// @ts-nocheck
import { Component, OnInit } from '@angular/core';
import { DataService, NotificationService, SharedModule } from '@vendure/admin-ui/core';
import { gql } from 'graphql-tag';


const GET_CANCELLATION_REQUESTS = gql`
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


const APPROVE_MUTATION = gql`
  mutation ApproveCancellation($id: ID!, $adminNote: String) {
    approveCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`;


const REJECT_MUTATION = gql`
  mutation RejectCancellation($id: ID!, $adminNote: String!) {
    rejectCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`;


@Component({
  selector: 'cancellation-list',
  standalone: true,
  imports: [SharedModule],
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
})
export class CancellationListComponent implements OnInit {
  items: any[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;


  constructor(
    private dataService: DataService,
    private notificationService: NotificationService
  ) {}


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
      .mapSingle((data: any) => data.cancellationRequests)
      .subscribe(
        result => {
          this.items = result.items;
          this.totalItems = result.total;
        },
        error => {
          this.notificationService.error('Failed to load cancellation requests');
        }
      );
  }


  onPageChange(page: number) {
    this.currentPage = page;
    this.loadRequests();
  }


  approve(id: string) {
    const adminNote = prompt('Add approval note (optional):');
    this.dataService
      .mutate(APPROVE_MUTATION, { id, adminNote })
      .subscribe(
        () => {
          this.notificationService.success('Cancellation request approved');
          this.loadRequests();
        },
        error => {
          this.notificationService.error('Failed to approve request');
        }
      );
  }


  reject(id: string) {
    const adminNote = prompt('Add rejection note (required):');
    if (!adminNote) {
      this.notificationService.error('Rejection note is required');
      return;
    }
    this.dataService
      .mutate(REJECT_MUTATION, { id, adminNote })
      .subscribe(
        () => {
          this.notificationService.success('Cancellation request rejected');
          this.loadRequests();
        },
        error => {
          this.notificationService.error('Failed to reject request');
        }
      );
  }


  getBadgeType(status: string): 'success' | 'error' | 'warning' {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'warning';
    }
  }
}
