import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { url, authToken } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

        if (isSQLite) {
            const { createClient } = await import('@libsql/client');
            const client = createClient({ url, authToken });
            try {
                await client.execute('SELECT 1');
                return NextResponse.json({ success: true, message: 'SQLite/Turso connection successful' });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message }, { status: 400 });
            }
        } else if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
            const postgres = (await import('postgres')).default;
            const sql = postgres(url, { connect_timeout: 5 });
            try {
                await sql`SELECT 1`;
                await sql.end();
                return NextResponse.json({ success: true, message: 'PostgreSQL connection successful' });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Unsupported database protocol. Use libsql://, file:, or postgres://' }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to test connection: ' + e.message }, { status: 500 });
    }
}
