import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow static assets, login page, and auth APIs
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth')
    ) {
        return NextResponse.next();
    }

    // If no ADMIN_PASSWORD is set, the app is open to everyone (no auth required)
    if (!process.env.ADMIN_PASSWORD) {
        return NextResponse.next();
    }

    // Password is set — check for auth cookie
    const tokenCookie = request.cookies.get('auth-token');
    if (!tokenCookie || tokenCookie.value !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icon\\.png|.*\\.svg|.*\\.png).*)',
    ],
};
