import { addNavMenuSection } from '@vendure/admin-ui/core';

export default [
    addNavMenuSection({
        id: 'cancellation-requests',
        label: 'Cancellations',
        items: [{
            id: 'cancellation-list',
            label: 'Cancellation Requests',
            routerLink: ['/extensions/cancellation-requests'],
            icon: 'close-circle',
        }],
    }, 
    'orders'), // Adds it after the "orders" section
];
