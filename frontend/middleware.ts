import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If the user is not authenticated
  if (!accessToken) {
    if (isAuthPage) {
      return NextResponse.next(); // Allow access to auth pages
    }
    // Redirect any other protected route to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated
  if (isAuthPage) {
    // Redirect to the appropriate dashboard based on role
    switch (userRole) {
      case 'ADMIN':
        return NextResponse.redirect(new URL('/admin', request.url));
      case 'ACCOUNTANT':
      case 'ACCOUNTLEAD':
        return NextResponse.redirect(new URL('/admin/finance', request.url));
      case 'TEACHER':
        return NextResponse.redirect(new URL('/teacher', request.url));
      case 'STUDENT':
        return NextResponse.redirect(new URL('/student', request.url));
      case 'DRIVER':
        return NextResponse.redirect(new URL('/driver', request.url));
      case 'WORKER':
        return NextResponse.redirect(new URL('/worker', request.url));
      default:
        // Fallback to homepage if role is not defined
        return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Role-based route protection for dashboard access
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN' && userRole !== 'ACCOUNTANT' && userRole !== 'ACCOUNTLEAD') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Safeguard administrative pages from Accountant/Lead roles
    const adminOnlyPaths = [
      '/admin/users',
      '/admin/classes',
      '/admin/subjects',
      '/admin/exams',
      '/admin/materials',
      '/admin/assign-teacher',
      '/admin/assign-student',
      '/admin/timetable',
      '/admin/settings'
    ];
    if (userRole !== 'ADMIN' && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/finance', request.url));
    }
  }

  if (pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/student') && userRole !== 'STUDENT') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/driver') && userRole !== 'DRIVER') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/worker') && userRole !== 'WORKER') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/driver/:path*',
    '/worker/:path*',
  ],
};

