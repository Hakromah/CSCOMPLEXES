export default {
  async getMyNotifications(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { page = 1, pageSize = 20, type } = ctx.query;
    const where: any = { recipient: { id: user.id } };
    if (type) where.type = type;
    const notifications = await strapi.db.query('api::school-notification.school-notification').findMany({
      where,
      populate: ['sender'],
      orderBy: { createdAt: 'desc' },
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
    ctx.body = { notifications, page: Number(page), pageSize: Number(pageSize) };
  },

  async getUnreadCount(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const count = await strapi.db.query('api::school-notification.school-notification').count({
      where: { recipient: { id: user.id }, isRead: false },
    });
    ctx.body = { count };
  },

  async markAsRead(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const notif = await strapi.entityService.findOne(
      'api::school-notification.school-notification', ctx.params.id, { populate: ['recipient'] }
    ) as any;
    if (!notif || notif.recipient?.id !== user.id) return ctx.forbidden('Access denied');
    const updated = await strapi.entityService.update('api::school-notification.school-notification', ctx.params.id, {
      data: { isRead: true, readAt: new Date().toISOString() },
    });
    ctx.body = updated;
  },

  async markAllRead(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    await strapi.db.query('api::school-notification.school-notification').updateMany({
      where: { recipient: { id: user.id }, isRead: false },
      data: { isRead: true, readAt: new Date().toISOString() },
    });
    ctx.body = { message: 'All notifications marked as read' };
  },

  async sendNotification(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { recipientId, title, body, type, priority, actionUrl, metadata } = ctx.request.body;
    const notif = await strapi.entityService.create('api::school-notification.school-notification', {
      data: {
        title, body,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        recipient: recipientId,
        sender: user.id,
        isRead: false,
        actionUrl, metadata,
      },
    });
    ctx.status = 201;
    ctx.body = notif;
  },

  async broadcastAnnouncement(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { title, body, type, priority, targetRole, actionUrl } = ctx.request.body;
    const where: any = {};
    if (targetRole) where.schoolRole = targetRole;
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({ where, select: ['id'] });
    const created = await Promise.all(
      users.map((u: any) =>
        strapi.entityService.create('api::school-notification.school-notification', {
          data: {
            title, body,
            type: type || 'ANNOUNCEMENT',
            priority: priority || 'NORMAL',
            recipient: u.id,
            sender: user.id,
            isRead: false,
            actionUrl,
          },
        })
      )
    );
    ctx.body = { sent: created.length, message: `Broadcast sent to ${created.length} users` };
  },

  async deleteNotification(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::school-notification.school-notification', ctx.params.id);
    ctx.body = { message: 'Notification deleted' };
  },
};
