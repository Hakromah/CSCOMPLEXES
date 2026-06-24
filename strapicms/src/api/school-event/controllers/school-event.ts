export default {
  async findAll(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.entityService.findMany('api::school-event.school-event', {
      populate: ['targetClass', 'createdBy'],
      sort: { startDate: 'asc' },
    });
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    ctx.body = await strapi.entityService.findOne('api::school-event.school-event', ctx.params.id, {
      populate: ['targetClass', 'createdBy'],
    });
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const event = await strapi.entityService.create('api::school-event.school-event', {
      data: { ...ctx.request.body, createdBy: user.id },
      populate: ['targetClass', 'createdBy'],
    });
    ctx.status = 201;
    ctx.body = event;
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.entityService.update('api::school-event.school-event', ctx.params.id, {
      data: ctx.request.body,
      populate: ['targetClass', 'createdBy'],
    });
  },

  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::school-event.school-event', ctx.params.id);
    ctx.body = { message: 'Event deleted' };
  },

  async findPublished(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const roleAudienceMap: Record<string, string[]> = {
      STUDENT: ['ALL', 'STUDENTS'],
      PARENT: ['ALL', 'PARENTS'],
      TEACHER: ['ALL', 'STAFF'],
      ADMIN: ['ALL', 'STUDENTS', 'PARENTS', 'STAFF', 'CLASS'],
      ACCOUNTANT: ['ALL', 'STAFF'],
      ACCOUNTLEAD: ['ALL', 'STAFF'],
      DRIVER: ['ALL', 'STAFF'],
      WORKER: ['ALL', 'STAFF'],
    };
    const audiences = roleAudienceMap[user.schoolRole] || ['ALL'];
    const { month, year } = ctx.query;
    const where: any = { isPublished: true, targetAudience: { $in: audiences } };
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
      where.startDate = { $gte: start, $lte: end };
    }
    ctx.body = await strapi.db.query('api::school-event.school-event').findMany({
      where,
      populate: ['targetClass'],
      orderBy: { startDate: 'asc' },
    });
  },
};
