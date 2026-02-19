import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

// Public endpoint - no auth required
// GET /api/share/[token] → return note if shareToken matches
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const storage = await getStorage();

        // Search through all notes for matching shareToken
        const allNotes = await storage.exportAll();
        const note = allNotes.find(n => n.shareToken === token && !n.deletedAt);

        if (!note) {
            return NextResponse.json({ error: 'Note not found or sharing disabled' }, { status: 404 });
        }

        // Return only safe fields (no internal metadata)
        return NextResponse.json({
            id: note.id,
            title: note.title,
            content: note.content,
            updatedAt: note.updatedAt,
            tags: note.tags || [],
        });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
