import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

// POST /api/notes/[id]/archive - Archive a note
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        
        // Get existing note
        const existing = await storage.get(id);
        if (!existing) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }
        
        if (existing.archived_at) {
            return NextResponse.json({ error: 'Note already archived' }, { status: 400 });
        }
        
        const now = Date.now();
        
        // Update note with archived_at
        const archivedNote = {
            ...existing,
            archived_at: now,
            updatedAt: now,
        };
        
        await storage.save(archivedNote);
        
        return NextResponse.json({ success: true, archived_at: now });
    } catch (e: unknown) {
        console.error('[API] POST /api/notes/[id]/archive error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
