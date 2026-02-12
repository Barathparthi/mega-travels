import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that should never require authentication
const publicRoutes = [
  '/manifest.json',
  '/sw.js',
  '/api/auth',
  '/login',
  '/_next',
  '/icons',
  '/screenshots',
  '/favicon.ico',
];

function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => path.startsWith(route) || path === route);
}

// Create the protected middleware using withAuth
const protectedMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Driver routes protection
    if (path.startsWith('/driver')) {
      if (token?.role !== 'driver') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // For protected routes, require token
        return !!token;
      },
    },
  }
);

// Main middleware that checks public routes first
export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Early return for public routes - completely bypass withAuth
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  // For protected routes, use withAuth middleware
  return protectedMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - icons (icon files)
     * - screenshots (screenshot files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|screenshots).*)',
  ],
};
