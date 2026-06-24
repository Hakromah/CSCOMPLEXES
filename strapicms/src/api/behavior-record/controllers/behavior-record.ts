export default {
  async findAll(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { studentId, type, page = 1, pageSize = 20 } = ctx.query;
    const where: any = {};
    if (studentId) where.student = { id: Number(studentId) };
    if (type) where.type = type;
    ctx.body = await strapi.db.query('api::behavior-record.behavior-record').findMany({
      where,
      populate: ['student', 'recordedBy'],
      orderBy: { date: 'desc' },
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
    });
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user || !['ADMIN', 'TEACHER'].includes(user.schoolRole)) return ctx.unauthorized('Access denied');
    const record = await strapi.entityService.findOne('api::behavior-record.behavior-record', ctx.params.id, {
      populate: ['student', 'recordedBy'],
    });
    if (!record) return ctx.notFound();
    ctx.body = record;
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user || !['ADMIN', 'TEACHER'].includes(user.schoolRole)) return ctx.unauthorized('Access denied');
    const data = { ...ctx.request.body, recordedBy: user.id };
    const record = await strapi.entityService.create('api::behavior-record.behavior-record', {
      data,
      populate: ['student', 'recordedBy'],
    });
    // Notify parent if needed
    if (data.notifyParent !== false) {
      try {
        const studentId = data.student;
        const families = await strapi.db.query('api::family.family').findMany({
          where: { students: { id: studentId } },
          populate: ['parents'],
        }) as any[];
        for (const family of families) {
          for (const parent of (family.parents || [])) {
            await strapi.entityService.create('api::school-notification.school-notification', {
              data: {
                title: `Behavior Record: ${data.title}`,
                body: data.description || data.title,
                type: 'BEHAVIOR',
                priority: data.severity === 'HIGH' ? 'HIGH' : 'NORMAL',
                recipient: parent.id,
                sender: user.id,
                isRead: false,
              },
            });
          }
        }
        await strapi.entityService.update('api::behavior-record.behavior-record', (record as any).id, {
          data: { parentNotified: true },
        });
      } catch (e) {
        strapi.log.warn('[BehaviorRecord] Failed to notify parent:', e);
      }
    }
    ctx.status = 201;
    ctx.body = record;
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user || !['ADMIN', 'TEACHER'].includes(user.schoolRole)) return ctx.unauthorized('Access denied');
    ctx.body = await strapi.entityService.update('api::behavior-record.behavior-record', ctx.params.id, {
      data: ctx.request.body,
      populate: ['student', 'recordedBy'],
    });
  },

  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::behavior-record.behavior-record', ctx.params.id);
    ctx.body = { message: 'Record deleted' };
  },

  async getMyStudentsBehavior(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'TEACHER') return ctx.unauthorized('Access denied');
    const { studentId } = ctx.params;
    // Verify student is in teacher's class
    const classes = await strapi.db.query('api::school-class.school-class').findMany({
      where: { teachers: { id: user.id } },
      populate: ['students'],
    }) as any[];
    const myStudentIds = classes.flatMap((c: any) => (c.students || []).map((s: any) => s.id));
    if (!myStudentIds.includes(Number(studentId))) return ctx.forbidden('Student not in your classes');
    ctx.body = await strapi.db.query('api::behavior-record.behavior-record').findMany({
      where: { student: { id: Number(studentId) } },
      populate: ['student', 'recordedBy'],
      orderBy: { date: 'desc' },
    });
  },

  async getChildBehavior(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { studentId } = ctx.params;
    // Verify student is in parent's family
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, students: { id: Number(studentId) } },
    });
    if (!families.length) return ctx.forbidden('Student not in your family');
    ctx.body = await strapi.db.query('api::behavior-record.behavior-record').findMany({
      where: { student: { id: Number(studentId) } },
      populate: ['recordedBy'],
      orderBy: { date: 'desc' },
    });
  },
};
