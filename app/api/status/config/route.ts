import { NextResponse } from 'next/server';

export async function GET() {
    const config = {
        database: {
            connected: !!(process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL),
            type: (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL)?.startsWith('libsql') ? 'Turso (SQLite)' : (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL) ? 'PostgreSQL' : 'None',
        },
        blob: {
            connected: !!process.env.BLOB_READ_WRITE_TOKEN,
            provider: 'Vercel Blob',
        },
        s3: {
            connected: !!process.env.S3_ACCESS_KEY_ID,
            provider: 'S3 Compatible',
        },
        activeStorage: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL ? 'Database' : process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'Local Memory (Demo)',
    };

    return NextResponse.json(config);
}
