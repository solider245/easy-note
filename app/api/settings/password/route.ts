import { NextRequest, NextResponse } from 'next/server';
import { checkPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();

        if (!checkPassword(currentPassword)) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        // Store the new password in the database settings table
        const { getDb } = await import('@/lib/db');
        const db = await getDb();

        const url = process.env.DATABASE_URL!;
        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
        const { settings } = isSQLite
            ? await import('@/lib/db/schema')
            : await import('@/lib/db/schema.pg');

        await (db as any).insert(settings).values({
            key: 'admin_password',
            value: newPassword,
        }).onConflictDoUpdate({
            target: settings.key,
            set: { value: newPassword },
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
