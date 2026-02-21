import { NextResponse } from 'next/server';
import { isUsingGeneratedPassword, isPasswordProtected } from '@/lib/auth';

export async function GET() {
    try {
        // Check password status
        const passwordProtected = await isPasswordProtected();
        const isGeneratedPassword = await isUsingGeneratedPassword();
        const envPassword = process.env.ADMIN_PASSWORD;
        
        // Security warning conditions:
        // 1. Using auto-generated password (not set by user)
        // 2. No password protection at all
        const isUsingDefaultPassword = isGeneratedPassword || !passwordProtected;
        
        return NextResponse.json({
            isUsingDefaultPassword,
            isPasswordSet: passwordProtected,
            hasEnvPassword: !!envPassword,
            isGeneratedPassword,
            // Include a message for the user if using generated password
            message: isGeneratedPassword 
                ? 'Using auto-generated password. Please change it in settings for security.'
                : null,
        });
    } catch (error) {
        console.error('Auth status check error:', error);
        return NextResponse.json(
            { error: 'Failed to check auth status' },
            { status: 500 }
        );
    }
}