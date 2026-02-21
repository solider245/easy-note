import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

// GET /api/notes/archive - List all archived notes
export async function GET() {
    try {
        const storage = await getStorage();

        // Use exportAll to get all notes including archived ones
        const allNotes = await storage.exportAll();
        const archivedNotes = allNotes
            .filter(note => note.archived_at !== null && note.archived_at !== undefined)
            .sort((a, b) => (b.archived_at || 0) - (a.archived_at || 0));

        return NextResponse.json(archivedNotes);
    } catch (e: unknown) {
        console.error('[API] GET /api/notes/archive error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
