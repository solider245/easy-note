import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        const note = await storage.get(id);
        if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(note);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storage = await getStorage();
        const { title, content, isPinned, tags } = await request.json();

        const existing = await storage.get(id);
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updatedNote = {
            ...existing,
            title: title ?? existing.title,
            content: content ?? existing.content,
            isPinned: isPinned !== undefined ? isPinned : existing.isPinned,
            tags: tags !== undefined ? tags : (existing.tags || []),
            updatedAt: Date.now(),
        };

        await storage.save(updatedNote);
        return NextResponse.json(updatedNote);
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
        const { searchParams } = new URL(request.url);
        const purge = searchParams.get('purge') === 'true';

        await storage.del(id, purge);
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
