import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        const existing = await storage.get(id);

        if (!existing) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const restoredNote = {
            ...existing,
            deletedAt: null,
            archived_at: null,
            updatedAt: Date.now(),
        };

        await storage.save(restoredNote);
        return NextResponse.json(restoredNote);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
