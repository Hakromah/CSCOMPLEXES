import crypto from 'crypto';

export default {
  async getInbox(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const messages = await strapi.db.query('api::school-message.school-message').findMany({
      where: { recipient: { id: user.id }, isDeletedByRecipient: false },
      populate: ['sender', 'recipient'],
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    ctx.body = { messages };
  },

  async getSent(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const messages = await strapi.db.query('api::school-message.school-message').findMany({
      where: { sender: { id: user.id }, isDeletedBySender: false },
      populate: ['sender', 'recipient'],
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
    ctx.body = { messages };
  },

  async getThread(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { threadId } = ctx.params;
    const messages = await strapi.db.query('api::school-message.school-message').findMany({
      where: {
        threadId,
        $or: [{ sender: { id: user.id } }, { recipient: { id: user.id } }],
      },
      populate: ['sender', 'recipient'],
      orderBy: { createdAt: 'asc' },
    });
    ctx.body = { messages };
  },

  async getUnreadCount(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const count = await strapi.db.query('api::school-message.school-message').count({
      where: { recipient: { id: user.id }, isReadByRecipient: false, isDeletedByRecipient: false },
    });
    ctx.body = { count };
  },

  async sendMessage(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { recipientId, subject, body, attachmentUrl } = ctx.request.body;
    if (!recipientId || !subject || !body) {
      ctx.status = 400;
      return (ctx.body = { error: 'recipientId, subject, and body are required' });
    }
    const recipient = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: Number(recipientId) },
      select: ['id', 'schoolRole'],
    }) as any;
    if (!recipient) return ctx.notFound('Recipient not found');

    const threadId = crypto.randomBytes(8).toString('hex');
    const message = await strapi.entityService.create('api::school-message.school-message', {
      data: {
        subject, body, attachmentUrl,
        sender: user.id,
        recipient: Number(recipientId),
        threadId,
        isReadBySender: true,
        isReadByRecipient: false,
        senderRole: user.schoolRole,
        recipientRole: recipient.schoolRole,
      },
      populate: ['sender', 'recipient'],
    });
    ctx.status = 201;
    ctx.body = message;
  },

  async replyToMessage(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { body, attachmentUrl } = ctx.request.body;
    const parent = await strapi.entityService.findOne(
      'api::school-message.school-message', ctx.params.id, { populate: ['sender', 'recipient'] }
    ) as any;
    if (!parent) return ctx.notFound('Message not found');
    const recipientId = parent.sender?.id === user.id ? parent.recipient?.id : parent.sender?.id;
    const recipientRole = parent.sender?.id === user.id ? parent.recipientRole : parent.senderRole;
    const reply = await strapi.entityService.create('api::school-message.school-message', {
      data: {
        subject: `Re: ${parent.subject}`,
        body, attachmentUrl,
        sender: user.id,
        recipient: recipientId,
        threadId: parent.threadId,
        parentMessage: parent.id,
        isReadBySender: true,
        isReadByRecipient: false,
        senderRole: user.schoolRole,
        recipientRole,
      },
      populate: ['sender', 'recipient'],
    });
    ctx.status = 201;
    ctx.body = reply;
  },

  async markAsRead(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const msg = await strapi.entityService.findOne(
      'api::school-message.school-message', ctx.params.id, { populate: ['recipient'] }
    ) as any;
    if (!msg || msg.recipient?.id !== user.id) return ctx.forbidden('Access denied');
    ctx.body = await strapi.entityService.update('api::school-message.school-message', ctx.params.id, {
      data: { isReadByRecipient: true, readAt: new Date().toISOString() },
    });
  },

  async deleteMessage(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const msg = await strapi.entityService.findOne(
      'api::school-message.school-message', ctx.params.id, { populate: ['sender', 'recipient'] }
    ) as any;
    if (!msg) return ctx.notFound();
    const updateData: any = {};
    if (msg.sender?.id === user.id) updateData.isDeletedBySender = true;
    else if (msg.recipient?.id === user.id) updateData.isDeletedByRecipient = true;
    else return ctx.forbidden('Access denied');
    await strapi.entityService.update('api::school-message.school-message', ctx.params.id, { data: updateData });
    ctx.body = { message: 'Message deleted' };
  },
};
