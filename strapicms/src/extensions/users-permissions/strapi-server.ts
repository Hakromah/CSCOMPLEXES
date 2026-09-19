/**
 * users-permissions extension
 *
 * Overrides auth routes to:
 * 1. Set JWT in HTTP-only cookie on login (matching Spring Boot behavior)
 * 2. Set userRole cookie on login
 * 3. Add /auth/logout to clear cookies
 * 4. Auto-generate userId on registration
 */

import crypto from 'crypto';


async function generateUserId(firstName: string, lastName: string, registrationYear?: number): Promise<string> {
  const year = registrationYear ?? new Date().getFullYear();
  const fi = (firstName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const li = (lastName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const yy = String(year).slice(-2);
  const prefix = `${fi}${li}${yy}`; // e.g. "HK26"

  // strapi.db.query uses raw SQL LIKE — works on uid and string fields alike
  const existing = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: { userId: { $startsWith: prefix } },
    select: ['userId'],
  }) as Array<{ userId: string }>;

  let maxSeq = 0;
  for (const user of existing) {
    const tail = user.userId?.slice(4);
    const seq = parseInt(tail ?? '0', 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, '0')}`;
}

export default (plugin: any) => {
  // ─── Add Custom Fields to User Model ──────────────────────────────
  plugin.contentTypes.user.schema.attributes = {
    ...plugin.contentTypes.user.schema.attributes,
    userId: { type: 'uid', unique: true },
    birthDate: { type: 'date' },
    birthCountry: { type: 'string' },
    birthCity: { type: 'string' },
    address: { type: 'text' },
    gender: { type: 'enumeration', enum: ['Male', 'Female', 'Other'] },
    phoneNumber: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    schoolRole: { type: 'enumeration', enum: ['ADMIN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'ACCOUNTLEAD', 'DRIVER', 'WORKER', 'PARENT'] },
    teachingClasses: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::school-class.school-class',
      mappedBy: 'teachers',
    },
    enrolledClasses: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::school-class.school-class',
      mappedBy: 'students',
    },
    familyMemberships: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::family.family',
      mappedBy: 'parents',
    },
  };

  // ─── Override: Register ───────────────────────────────────────────
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    // Auto-generate userId before calling original register
    const body = ctx.request.body;
    if (!body.userId) {
      body.userId = await generateUserId(
        body.firstName || body.username?.split(' ')[0] || 'X',
        body.lastName  || body.username?.split(' ')[1] || 'X'
      );
    }

    // Set schoolRole from the request (defaults to STUDENT)
    if (!body.schoolRole) {
      body.schoolRole = 'STUDENT';
    }

    await originalRegister.call(this, ctx);
  };

  return plugin;
};
