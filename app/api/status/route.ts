import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET() {
    try {
        const storage = await getStorage();
        // Try a simple list to check connectivity
        await storage.list();

        // Fetch real usage if available
        let usage: { used: number; total: number } | undefined;
        if (storage.getUsage) {
            usage = await storage.getUsage();
        }

        return NextResponse.json({ status: 'connected', usage });
    } catch (e: unknown) {
        return NextResponse.json({
            status: 'error',
            message: (e as Error).message,
            hint: 'Ensure Vercel Blob is connected in your project dashboard and BLOB_READ_WRITE_TOKEN is set.'
        }, { status: 500 });
    }
}
