import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';

export async function GET() {
    try {
        const storage = await getStorage();
        const notes = await storage.list();
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
        };

        await storage.save(note);
        return NextResponse.json(note);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
