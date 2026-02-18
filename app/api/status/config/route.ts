import { NextResponse } from 'next/server';

import { configService } from '@/lib/config/config-service';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const s3Key = await configService.get('S3_ACCESS_KEY_ID');
    const blobToken = await configService.get('BLOB_READ_WRITE_TOKEN');

    const config = {
        database: {
            connected: !!dbUrl,
            type: dbUrl?.startsWith('libsql') ? 'Turso (SQLite)' : dbUrl ? 'PostgreSQL' : 'None',
        },
        blob: {
            connected: !!blobToken,
            provider: 'Vercel Blob',
        },
        s3: {
            connected: !!s3Key,
            provider: 'S3 Compatible',
        },
        ai: {
            openai: !!(await configService.get('OPENAI_API_KEY')),
        },
        activeStorage: dbUrl ? 'Database' : blobToken ? 'Vercel Blob' : 'Local Memory (Demo)',
    };

    return NextResponse.json(config);
}

export async function POST(req: Request) {
    try {
        const { key, value } = await req.json();
        if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

        await configService.set(key, value);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
