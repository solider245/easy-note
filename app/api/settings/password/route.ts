import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordWithDb } from '@/lib/auth';
import { configService } from '@/lib/config/config-service';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();

        // Use checkPasswordWithDb to support DB-stored passwords
        if (!await checkPasswordWithDb(currentPassword)) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        // Use configService.set() to handle encryption and correct key name (ADMIN_PASSWORD)
        await configService.set('ADMIN_PASSWORD', newPassword);

        // Clear cache so the new password takes effect immediately
        configService.clearCache();

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
