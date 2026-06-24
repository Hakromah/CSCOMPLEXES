import crypto from 'crypto';

export default {
  // ─── Admin: List all families ────────────────────────────────────────
  async findAll(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { populate, filters, pagination } = ctx.query;
    const families = await strapi.entityService.findMany('api::family.family', {
      populate: ['parents', 'students'],
      filters: filters || {},
      start: pagination?.start || 0,
      limit: pagination?.limit || 50,
    });
    ctx.body = families;
  },

  // ─── Admin: Get single family ─────────────────────────────────────────
  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ADMIN' && user.schoolRole !== 'PARENT')) {
      return ctx.unauthorized('Access denied');
    }
    const family = await strapi.entityService.findOne('api::family.family', ctx.params.id, {
      populate: ['parents', 'students'],
    });
    if (!family) return ctx.notFound('Family not found');
    if (user.schoolRole === 'PARENT') {
      const f = family as any;
      const isInFamily = (f.parents || []).some((p: any) => p.id === user.id);
      if (!isInFamily) return ctx.forbidden('Access denied');
    }
    ctx.body = family;
  },

  // ─── Admin: Create family ─────────────────────────────────────────────
  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const data = ctx.request.body;
    if (!data.familyCode) {
      data.familyCode = 'FAM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    const family = await strapi.entityService.create('api::family.family', { data, populate: ['parents', 'students'] });
    ctx.status = 201;
    ctx.body = family;
  },

  // ─── Admin: Update family ─────────────────────────────────────────────
  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const family = await strapi.entityService.update('api::family.family', ctx.params.id, {
      data: ctx.request.body,
      populate: ['parents', 'students'],
    });
    ctx.body = family;
  },

  // ─── Admin: Delete family ─────────────────────────────────────────────
  async remove(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    await strapi.entityService.delete('api::family.family', ctx.params.id);
    ctx.body = { message: 'Family deleted successfully' };
  },

  // ─── Admin: Add parent user to family ────────────────────────────────
  async addParent(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { userId } = ctx.request.body;
    const family = await strapi.entityService.findOne('api::family.family', ctx.params.id, {
      populate: ['parents'],
    }) as any;
    if (!family) return ctx.notFound('Family not found');
    const parentIds = (family.parents || []).map((p: any) => p.id);
    if (!parentIds.includes(Number(userId))) parentIds.push(Number(userId));
    const updated = await strapi.entityService.update('api::family.family', ctx.params.id, {
      data: { parents: parentIds },
      populate: ['parents', 'students'],
    });
    ctx.body = updated;
  },

  // ─── Admin: Remove parent from family ────────────────────────────────
  async removeParent(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const family = await strapi.entityService.findOne('api::family.family', ctx.params.id, {
      populate: ['parents'],
    }) as any;
    if (!family) return ctx.notFound('Family not found');
    const parentIds = (family.parents || [])
      .map((p: any) => p.id)
      .filter((id: number) => id !== Number(ctx.params.userId));
    const updated = await strapi.entityService.update('api::family.family', ctx.params.id, {
      data: { parents: parentIds },
      populate: ['parents', 'students'],
    });
    ctx.body = updated;
  },

  // ─── Admin: Add student to family ────────────────────────────────────
  async addStudent(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { userId } = ctx.request.body;
    const family = await strapi.entityService.findOne('api::family.family', ctx.params.id, {
      populate: ['students'],
    }) as any;
    if (!family) return ctx.notFound('Family not found');
    const studentIds = (family.students || []).map((s: any) => s.id);
    if (!studentIds.includes(Number(userId))) studentIds.push(Number(userId));
    const updated = await strapi.entityService.update('api::family.family', ctx.params.id, {
      data: { students: studentIds },
      populate: ['parents', 'students'],
    });
    ctx.body = updated;
  },

  // ─── Admin: Remove student from family ───────────────────────────────
  async removeStudent(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const family = await strapi.entityService.findOne('api::family.family', ctx.params.id, {
      populate: ['students'],
    }) as any;
    if (!family) return ctx.notFound('Family not found');
    const studentIds = (family.students || [])
      .map((s: any) => s.id)
      .filter((id: number) => id !== Number(ctx.params.userId));
    const updated = await strapi.entityService.update('api::family.family', ctx.params.id, {
      data: { students: studentIds },
      populate: ['parents', 'students'],
    });
    ctx.body = updated;
  },

  // ─── Parent: Get my family ────────────────────────────────────────────
  async getMyFamily(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, isActive: true },
      populate: ['parents', 'students'],
    });
    ctx.body = families[0] || null;
  },
};
