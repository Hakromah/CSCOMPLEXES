import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Wait for the auth controllers to finish handling the request
    await next();

    // If this is a successful local login request
    if (
      ctx.request.url === '/api/auth/local' &&
      ctx.request.method === 'POST' &&
      ctx.status === 200 &&
      ctx.body?.jwt &&
      ctx.body?.user
    ) {
      const jwt = ctx.body.jwt;
      const user = ctx.body.user;

      // Strapi v5 Document Service API call
      const fullUser = (await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId || user.id,
      })) as any;

      const role = fullUser?.schoolRole || 'STUDENT';
	
	// Attach the HTTP-only JWT token
      ctx.cookies.set('accessToken', jwt, {
        httpOnly: true,
        secure: false, // <--- CHANGE THIS TO FALSE
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
        sameSite: 'lax', // <--- CHANGE THIS TO 'lax' FOR PROXY COMPATIBILITY
      });

      // Attach the readable role string for the frontend Next.js router
      ctx.cookies.set('userRole', role, {
        httpOnly: false,
        secure: false, // <--- CHANGE THIS TO FALSE
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'lax', // <--- CHANGE THIS TO 'lax'
      });
    }
  };
};
