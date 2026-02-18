import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const storage = await getStorage();
        const note = await storage.get(params.id);
        if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(note);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const storage = await getStorage();
        const { title, content } = await request.json();

        const existing = await storage.get(params.id);
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updatedNote = {
            ...existing,
            title: title ?? existing.title,
            content: content ?? existing.content,
            updatedAt: Date.now(),
        };

        await storage.save(updatedNote);
        return NextResponse.json(updatedNote);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const storage = await getStorage();
        await storage.del(params.id);
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
