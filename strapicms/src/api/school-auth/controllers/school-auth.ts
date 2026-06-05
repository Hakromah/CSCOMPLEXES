/**
 * school-auth controller
 * Owns the custom /auth/logout and /auth/me endpoints.
 *
 * These live in a standalone API (not inside the users-permissions plugin extension)
 * to avoid Strapi's handler validation running before the plugin extension is applied.
 */

export default {
  /**
   * POST /api/auth/logout
   * Clears the accessToken and userRole cookies set on login.
   */
  async logout(ctx: any) {
    ctx.cookies.set('accessToken', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      secure: false,
      sameSite: 'lax',
    });
    ctx.cookies.set('userRole', '', {
      httpOnly: false,
      maxAge: 0,
      path: '/',
      secure: false,
      sameSite: 'lax',
    });
    ctx.body = { message: 'Logout successful' };
  },

  /**
   * GET /api/auth/me
   * Returns the full profile of the currently authenticated user.
   * Mirrors Spring Boot's GET /auth/me endpoint.
   */
  async me(ctx: any) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await strapi.entityService.findOne(
      'plugin::users-permissions.user' as any,
      user.id,
      { populate: ['role'] as any }
    ) as any;

    ctx.body = {
      id: fullUser.id,
      userId: fullUser.userId,
      name: fullUser.username,
      email: fullUser.email,
      role: fullUser.schoolRole || fullUser.role?.name,
      birthDate: fullUser.birthDate,
      birthCountry: fullUser.birthCountry,
      birthCity: fullUser.birthCity,
      address: fullUser.address,
      gender: fullUser.gender,
      phoneNumber: fullUser.phoneNumber,
      createdAt: fullUser.createdAt,
    };
  },
};
