import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const storage = await getStorage();
        const notes = query ? await storage.search(query) : await storage.list();
        return NextResponse.json(notes);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const storage = await getStorage();
        const { title, content } = await request.json();

        const id = nanoid();
        const now = Date.now();
        const note = {
            id,
            title: title || 'Untitled Note',
            content: content || '',
            createdAt: now,
            updatedAt: now,
            isPinned: false,
            deletedAt: null,
        };

        await storage.save(note);
        return NextResponse.json(note);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
