import { NextResponse } from 'next/server';
import { configService } from '@/lib/config/config-service';

export async function GET() {
    try {
        // Check if using default password
        const envPassword = process.env.ADMIN_PASSWORD;
        const dbPassword = await configService.get('ADMIN_PASSWORD');
        
        // Using default password if:
        // 1. No env password AND no db password (never changed)
        // 2. Password is explicitly set to admin123
        const isUsingDefaultPassword = !envPassword && !dbPassword;
        const isPasswordSet = !!(envPassword || dbPassword);
        
        return NextResponse.json({
            isUsingDefaultPassword,
            isPasswordSet,
            hasEnvPassword: !!envPassword,
            hasDbPassword: !!dbPassword,
        });
    } catch (error) {
        console.error('Auth status check error:', error);
        return NextResponse.json(
            { error: 'Failed to check auth status' },
            { status: 500 }
        );
    }
}