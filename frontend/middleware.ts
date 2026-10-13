import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isInvalidToken = !accessToken || isJwtExpired(accessToken);

  // If the user is not authenticated or token is expired
  if (isInvalidToken) {
    if (isAuthPage) {
      const response = NextResponse.next();
      if (accessToken) {
        response.cookies.delete('accessToken');
        response.cookies.delete('userRole');
      }
      return response;
    }
    // Redirect any other protected route to the login page and clear stale cookies
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('userRole');
    return response;
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
      case 'PARENT':
        return NextResponse.redirect(new URL('/parent', request.url));
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
      '/admin/settings',
      '/admin/attendance',
      '/admin/results',
      '/admin/reports',
      '/admin/transcripts',
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
  if (pathname.startsWith('/parent') && userRole !== 'PARENT') {
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
    '/parent/:path*',
    '/driver/:path*',
    '/worker/:path*',
  ],
};

