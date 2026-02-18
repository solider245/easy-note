import { NextRequest, NextResponse } from 'next/server';
import { checkPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const { password } = await request.json();

    if (checkPassword(password)) {
        const response = NextResponse.json({ success: true });
        // In a real app, use a secure signed token
        response.cookies.set('auth-token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
