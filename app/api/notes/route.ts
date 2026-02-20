import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        console.log('[API] Getting storage...');
        const storage = await getStorage();
        console.log('[API] Storage obtained, fetching notes...');
        const notes = query ? await storage.search(query) : await storage.list();
        console.log('[API] Notes fetched:', notes.length);
        return NextResponse.json(notes);
    } catch (e: unknown) {
        console.error('[API] GET /api/notes error:', e);
        return NextResponse.json({ error: (e as Error).message, stack: (e as Error).stack }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('[API] POST /api/notes - Getting storage...');
        const storage = await getStorage();
        console.log('[API] Storage obtained');
        const { title, content } = await request.json();
        console.log('[API] Request body parsed:', { title, content: content?.substring(0, 50) });

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

        console.log('[API] Saving note...');
        await storage.save(note);
        console.log('[API] Note saved successfully');
        return NextResponse.json(note);
    } catch (e: unknown) {
        console.error('[API] POST /api/notes error:', e);
        return NextResponse.json({ error: (e as Error).message, stack: (e as Error).stack }, { status: 500 });
    }
}
