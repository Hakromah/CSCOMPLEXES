/**
 * users-permissions extension
 *
 * Overrides auth routes to:
 * 1. Allow full-name usernames ("FirstName LastName") without unique constraint collisions
 * 2. Auto-generate structured userId on registration
 * 3. Automatically set username = "FirstName LastName" and email = "${userId.toLowerCase()}@2cscomplexes.com"
 * 4. Support login via email, username, or userId
 */

import crypto from 'crypto';


async function generateUserId(firstName: string, lastName: string, registrationYear?: number): Promise<string> {
  const year = registrationYear ?? new Date().getFullYear();
  const fi = (firstName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const li = (lastName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const yy = String(year).slice(-2);
  const prefix = `${fi}${li}${yy}`; // e.g. "KB26"

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
    // Allow full name ("FirstName LastName") as username even if two users share the same name;
    // uniqueness is guaranteed by userId and auto-generated email (userId@2cscomplexes.com).
    username: {
      ...(plugin.contentTypes.user.schema.attributes?.username || { type: 'string' }),
      unique: false,
    },
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
    const body = ctx.request.body;
    const rawName = (body.name || body.username || '').trim();
    const nameParts = rawName.split(/\s+/).filter(Boolean);
    const firstName = (body.firstName || nameParts[0] || 'X').trim();
    const lastName  = (body.lastName  || nameParts.slice(1).join(' ') || 'X').trim();

    body.firstName = firstName;
    body.lastName  = lastName;

    // Auto-generate userId before calling original register
    if (!body.userId) {
      body.userId = await generateUserId(firstName, lastName);
    }

    // Set username to First + Last Name
    const fullName = [firstName !== 'X' ? firstName : '', lastName !== 'X' ? lastName : '']
      .filter(Boolean)
      .join(' ')
      .trim();
    body.username = fullName || rawName || body.userId;

    // Automatically set email to generated userId + @2cscomplexes.com
    const emailDomain = process.env.SCHOOL_EMAIL_DOMAIN || '2cscomplexes.com';
    body.email = `${String(body.userId).trim().toLowerCase()}@${emailDomain}`;

    // Set schoolRole from the request (defaults to STUDENT)
    if (!body.schoolRole) {
      body.schoolRole = 'STUDENT';
    }

    await originalRegister.call(this, ctx);
  };

  // ─── Override: Login Callback (Support login by userId, email, or username) ──
  const originalCallback = plugin.controllers.auth.callback;
  if (originalCallback) {
    plugin.controllers.auth.callback = async (ctx: any) => {
      const body = ctx.request?.body;
      if (body && typeof body.identifier === 'string') {
        const rawIdentifier = body.identifier.trim();
        if (rawIdentifier) {
          // Check if a user already matches by email or username directly
          const directMatch = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: {
              $or: [
                { email: rawIdentifier.toLowerCase() },
                { username: rawIdentifier },
              ],
            },
            select: ['id', 'email'],
          });

          if (!directMatch) {
            // Try matching by userId (either raw "KB2600003" or prefix before "@" in "kb2600003@...")
            const candidateUserId = (rawIdentifier.includes('@') ? rawIdentifier.split('@')[0] : rawIdentifier).toUpperCase();
            const userByUserId = await strapi.db.query('plugin::users-permissions.user').findOne({
              where: { userId: candidateUserId },
              select: ['id', 'email'],
            });
            if (userByUserId?.email) {
              ctx.request.body.identifier = userByUserId.email;
            }
          }
        }
      }
      return await originalCallback.call(this, ctx);
    };
  }

  return plugin;
};
