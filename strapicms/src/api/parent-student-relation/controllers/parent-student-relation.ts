export default {
  async findAll(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { familyId } = ctx.query;
    const where: any = {};
    if (familyId) where.family = { id: Number(familyId) };
    ctx.body = await strapi.db.query('api::parent-student-relation.parent-student-relation').findMany({
      where,
      populate: ['parent', 'student', 'family'],
    });
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const rel = await strapi.entityService.findOne(
      'api::parent-student-relation.parent-student-relation',
      ctx.params.id,
      { populate: ['parent', 'student', 'family'] }
    );
    if (!rel) return ctx.notFound();
    ctx.body = rel;
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const rel = await strapi.entityService.create(
      'api::parent-student-relation.parent-student-relation',
      { data: ctx.request.body, populate: ['parent', 'student', 'family'] }
    );
    ctx.status = 201;
    ctx.body = rel;
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.entityService.update(
      'api::parent-student-relation.parent-student-relation',
      ctx.params.id,
      { data: ctx.request.body, populate: ['parent', 'student', 'family'] }
    );
  },

  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::parent-student-relation.parent-student-relation', ctx.params.id);
    ctx.body = { message: 'Relation deleted' };
  },

  async findByParent(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    ctx.body = await strapi.db.query('api::parent-student-relation.parent-student-relation').findMany({
      where: { parent: { id: user.id } },
      populate: ['student', 'family'],
    });
  },
};
