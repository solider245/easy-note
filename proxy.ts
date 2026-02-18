import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.CONFIG_ENCRYPTION_KEY || 'easy-note-auth-secret-change-me';

function verifyAuthToken(token: string): boolean {
    try {
        const parts = token.split(':');
        if (parts.length < 3) return false;
        const sig = parts.pop()!;
        const payload = parts.join(':');
        const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
        if (sig.length !== expected.length) return false;
        return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
        return false;
    }
}

export function proxy(request: NextRequest) {
    const tokenCookie = request.cookies.get('auth-token');
    const { pathname } = request.nextUrl;

    // Allow access to login page and auth APIs
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Redirect to login if not authenticated or token is invalid
    if (!tokenCookie || !verifyAuthToken(tokenCookie.value)) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest, must be public)
         * - icon.png / *.svg / *.png (public assets)
         */
        '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icon\\.png|.*\\.svg|.*\\.png).*)',
    ],
};
