/**
 * school-auth routes
 *
 * Registers /auth/logout and /auth/me as custom Strapi API routes.
 * These paths intentionally match the Spring Boot originals so no frontend code needs to change.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/logout',
      handler: 'school-auth.logout',
      config: {
        // logout doesn't need a valid JWT — just clear whatever cookies are present
        auth: false,
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: 'school-auth.me',
      config: {
        // auth required — Strapi will 401 if the JWT cookie is missing/invalid
        middlewares: [],
      },
    },
  ],
};
