export default {
  async findAll(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { driverId, studentId, isActive } = ctx.query;
    const where: any = {};
    if (driverId) where.driver = { id: Number(driverId) };
    if (studentId) where.student = { id: Number(studentId) };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    ctx.body = await strapi.db.query('api::transport-assignment.transport-assignment').findMany({
      where,
      populate: ['student', 'driver', 'academicYear'],
      orderBy: { createdAt: 'desc' },
    });
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const ta = await strapi.entityService.findOne('api::transport-assignment.transport-assignment', ctx.params.id, {
      populate: ['student', 'driver', 'academicYear'],
    }) as any;
    if (!ta) return ctx.notFound();
    if (user.schoolRole !== 'ADMIN') {
      const allowed = ta.student?.id === user.id || ta.driver?.id === user.id;
      if (!allowed) return ctx.forbidden('Access denied');
    }
    ctx.body = ta;
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const ta = await strapi.entityService.create('api::transport-assignment.transport-assignment', {
      data: ctx.request.body,
      populate: ['student', 'driver', 'academicYear'],
    });
    ctx.status = 201;
    ctx.body = ta;
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.entityService.update('api::transport-assignment.transport-assignment', ctx.params.id, {
      data: ctx.request.body,
      populate: ['student', 'driver', 'academicYear'],
    });
  },

  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::transport-assignment.transport-assignment', ctx.params.id);
    ctx.body = { message: 'Transport assignment deleted' };
  },

  async getMyAssignments(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'DRIVER') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.db.query('api::transport-assignment.transport-assignment').findMany({
      where: { driver: { id: user.id }, isActive: true },
      populate: ['student', 'academicYear'],
      orderBy: { createdAt: 'desc' },
    });
  },

  async getMyTransport(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    const assignments = await strapi.db.query('api::transport-assignment.transport-assignment').findMany({
      where: { student: { id: user.id }, isActive: true },
      populate: ['driver', 'academicYear'],
    });
    ctx.body = assignments[0] || null;
  },

  async getChildTransport(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { studentId } = ctx.params;
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, students: { id: Number(studentId) } },
    });
    if (!families.length) return ctx.forbidden('Student not in your family');
    const assignments = await strapi.db.query('api::transport-assignment.transport-assignment').findMany({
      where: { student: { id: Number(studentId) }, isActive: true },
      populate: ['driver', 'academicYear'],
    });
    ctx.body = assignments[0] || null;
  },
};
