import { registerRouteComponent } from '@vendure/admin-ui/core';
import { CancellationListComponent } from './components/cancellation-list.component';

export default [
  registerRouteComponent({
    component: CancellationListComponent,
    path: '',
    title: 'Cancellation Requests',
    breadcrumb: 'Cancellation Requests',
  }),
];
