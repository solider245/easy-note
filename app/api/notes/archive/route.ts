import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/notes/archive - List all archived notes
export async function GET() {
    try {
        const db = await getDb();
        const isSQLite = process.env.DATABASE_URL?.startsWith('libsql://') || 
                        process.env.DATABASE_URL?.startsWith('file:') ||
                        process.env.TURSO_DATABASE_URL?.startsWith('libsql://');
        
        let query: string;
        
        if (isSQLite) {
            query = `
                SELECT * FROM notes 
                WHERE archived_at IS NOT NULL 
                ORDER BY archived_at DESC
            `;
        } else {
            query = `
                SELECT * FROM notes 
                WHERE archived_at IS NOT NULL 
                ORDER BY archived_at DESC
            `;
        }
        
        const result = await (db as any).execute(query);
        const archivedNotes = result.rows || [];
        
        return NextResponse.json(archivedNotes);
    } catch (e: unknown) {
        console.error('[API] GET /api/notes/archive error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
