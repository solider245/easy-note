import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/notes/[id]/archive - Archive a note
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = await getDb();
        const isSQLite = process.env.DATABASE_URL?.startsWith('libsql://') || 
                        process.env.DATABASE_URL?.startsWith('file:') ||
                        process.env.TURSO_DATABASE_URL?.startsWith('libsql://');
        
        const now = Date.now();
        let query: string;
        let params_array: any[];
        
        if (isSQLite) {
            query = `
                UPDATE notes 
                SET archived_at = ?,
                    updated_at = ?
                WHERE id = ? AND archived_at IS NULL
            `;
            params_array = [now, now, id];
        } else {
            query = `
                UPDATE notes 
                SET archived_at = $1,
                    updated_at = $2
                WHERE id = $3 AND archived_at IS NULL
            `;
            params_array = [now, now, id];
        }
        
        const result = await (db as any).execute(query, params_array);
        
        if (result.rowsAffected === 0 || result.rowCount === 0) {
            return NextResponse.json({ error: 'Note not found or already archived' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, archived_at: now });
    } catch (e: unknown) {
        console.error('[API] POST /api/notes/[id]/archive error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
