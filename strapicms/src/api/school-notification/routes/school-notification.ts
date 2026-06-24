export default {
  routes: [
    { method: 'GET',    path: '/notifications',               handler: 'school-notification.getMyNotifications' },
    { method: 'GET',    path: '/notifications/unread-count',  handler: 'school-notification.getUnreadCount' },
    { method: 'PATCH',  path: '/notifications/:id/read',      handler: 'school-notification.markAsRead' },
    { method: 'POST',   path: '/notifications/mark-all-read', handler: 'school-notification.markAllRead' },
    { method: 'POST',   path: '/notifications/send',          handler: 'school-notification.sendNotification' },
    { method: 'POST',   path: '/notifications/broadcast',     handler: 'school-notification.broadcastAnnouncement' },
    { method: 'DELETE', path: '/notifications/:id',           handler: 'school-notification.deleteNotification' },
  ],
};
