export default {
  routes: [
    { method: 'GET',    path: '/messages/inbox',              handler: 'school-message.getInbox' },
    { method: 'GET',    path: '/messages/sent',               handler: 'school-message.getSent' },
    { method: 'GET',    path: '/messages/thread/:threadId',   handler: 'school-message.getThread' },
    { method: 'GET',    path: '/messages/unread-count',       handler: 'school-message.getUnreadCount' },
    { method: 'POST',   path: '/messages',                    handler: 'school-message.sendMessage' },
    { method: 'POST',   path: '/messages/:id/reply',          handler: 'school-message.replyToMessage' },
    { method: 'PATCH',  path: '/messages/:id/read',           handler: 'school-message.markAsRead' },
    { method: 'DELETE', path: '/messages/:id',                handler: 'school-message.deleteMessage' },
  ],
};
