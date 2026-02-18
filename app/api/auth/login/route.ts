import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordWithDb, generateAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const { password } = await request.json();

    if (await checkPasswordWithDb(password)) {
        const response = NextResponse.json({ success: true });
        // Use HMAC-signed token to prevent cookie forgery
        response.cookies.set('auth-token', generateAuthToken(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
