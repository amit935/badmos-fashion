export const extensionRoutes = [  {
    path: 'extensions/cancellation-requests',
    loadChildren: () => import('./extensions/cancellation-request/routes'),
  }];
