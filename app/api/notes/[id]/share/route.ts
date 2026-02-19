import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';

// POST /api/notes/[id]/share  → enable sharing, return shareToken
// DELETE /api/notes/[id]/share → disable sharing
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        const note = await storage.get(id);
        if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Reuse existing token or generate new one
        const shareToken = note.shareToken || nanoid(16);
        await storage.save({ ...note, shareToken, updatedAt: Date.now() });

        return NextResponse.json({ shareToken, url: `/share/${shareToken}` });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        const note = await storage.get(id);
        if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await storage.save({ ...note, shareToken: null, updatedAt: Date.now() });
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
