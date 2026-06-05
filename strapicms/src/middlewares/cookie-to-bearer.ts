/**
 * \`cookie-to-bearer\` middleware
 * 
 * Automatically reads the HTTP-only \`accessToken\` cookie and injects it as
 * an \`Authorization: Bearer <token>\` header so that Strapi's native users-permissions
 * plugin can authenticate requests matching the Spring Boot architecture.
 */

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const token = ctx.cookies.get('accessToken');
    const isAuthRoute = ctx.request.url && ctx.request.url.includes('/auth/local');
    
    // Do not inject the token if hitting auth gateways.
    // Strapi natively throws 403 Forbidden if a logged-in user tries to bypass the login route.
    if (token && !ctx.request.header.authorization && !isAuthRoute) {
      ctx.request.header.authorization = `Bearer ${token}`;
    }
    
    await next();
  };
};
