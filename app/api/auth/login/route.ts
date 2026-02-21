import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordWithDb, AUTH_COOKIE_VALUE } from '@/lib/auth';
import { loginSchema, validateRequest } from '@/lib/validation';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    // Check rate limit (5 attempts per 15 minutes)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`login:${clientId}`, {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            {
                success: false,
                error: 'Too many login attempts. Please try again later.',
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            },
            { status: 429 }
        );
    }

    // Validate input
    const validation = await validateRequest(request, loginSchema);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { password } = validation.data;

    if (await checkPasswordWithDb(password)) {
        const response = NextResponse.json({ success: true });
        response.cookies.set('auth-token', AUTH_COOKIE_VALUE, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
