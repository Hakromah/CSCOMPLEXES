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


function generateUserId(): string {
  // 12-character alphanumeric unique ID, matching Spring Boot's userId field
  return crypto.randomBytes(6).toString('hex').toUpperCase().substring(0, 12);
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
    schoolRole: { type: 'enumeration', enum: ['ADMIN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'ACCOUNTLEAD', 'DRIVER', 'WORKER'] },
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
  };

  // ─── Override: Register ───────────────────────────────────────────
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    // Auto-generate userId before calling original register
    const body = ctx.request.body;
    if (!body.userId) {
      // We'll add userId after user creation via lifecycle or by calling the
      // original and then updating — simplest: just pre-set it on the body
      body.userId = generateUserId();
    }

    // Set schoolRole from the request (defaults to STUDENT)
    if (!body.schoolRole) {
      body.schoolRole = 'STUDENT';
    }

    await originalRegister.call(this, ctx);
    };

    return plugin;
};
