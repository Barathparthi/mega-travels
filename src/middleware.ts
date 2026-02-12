import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Define paths that don't need authentication
  const publicPaths = [
    '/login',
    '/api/auth',
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/icons',
    '/layout',
    '/screenshots'
  ];

  // Check if it's a public path or a static asset
  const isPublic =
    publicPaths.some(p => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.includes('.'); // Simple check for files

  if (isPublic) {
    return NextResponse.next();
  }

  // Get the token using the secret
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Debug log (remove in final production if too noisy, but helpful now)
  // console.log(`[Middleware] ${path} - Token: ${!!token} - Role: ${token?.role}`);

  // If no token and trying to access a protected route
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // Admin routes protection
  if (path.startsWith('/admin')) {
    if (token.role !== 'admin') {
      // Redirect to home or login if role mismatch
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Driver routes protection
  if (path.startsWith('/driver')) {
    if (token.role !== 'driver') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled in code, but good to exclude from matcher too if possible)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
