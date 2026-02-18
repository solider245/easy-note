import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordWithDb, AUTH_COOKIE_VALUE } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const { password } = await request.json();

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
