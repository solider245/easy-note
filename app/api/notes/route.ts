import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';
import { calculateNoteStats, getDeviceInfo } from '@/lib/utils/note-stats';
import { createNoteSchema, validateRequest } from '@/lib/validation';

// Helper to return safe error response (no stack in production)
function errorResponse(error: unknown, status: number = 500) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
        { 
            error: message,
            ...(isDev && stack ? { stack } : {})
        }, 
        { status }
    );
}

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
        return errorResponse(e, 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Validate input
        const validation = await validateRequest(request, createNoteSchema);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        console.log('[API] POST /api/notes - Getting storage...');
        const storage = await getStorage();
        console.log('[API] Storage obtained');
        const { title, content } = validation.data;
        console.log('[API] Request body parsed:', { title, content: content?.substring(0, 50) });

        const id = nanoid();
        const now = Date.now();

        // Calculate note statistics
        const stats = calculateNoteStats(title || '', content || '');

        const note = {
            id,
            title: title || 'Untitled Note',
            content: content || '',
            createdAt: now,
            updatedAt: now,
            isPinned: false,
            deletedAt: null,

            // v1.1.0: Auto-calculated statistics
            word_count: stats.word_count,
            char_count: stats.char_count,
            read_time_minutes: stats.read_time_minutes,
            view_count: 0,
            edit_count: 0,

            code_blocks: stats.code_blocks,
            image_count: stats.image_count,
            link_count: stats.link_count,
            content_hash: stats.content_hash,
            cover_image: stats.cover_image,
            first_paragraph: stats.first_paragraph,

            language: stats.language,
            note_type: 'article',
            folder_path: '/',
            metadata: '{}',

            sort_order: 0,
            is_starred: false,
            status: 'draft',
            priority: 0,

            updated_device: getDeviceInfo(),
            version: 1,
        };

        console.log('[API] Saving note with stats:', { word_count: stats.word_count, read_time: stats.read_time_minutes });
        await storage.save(note as any);
        console.log('[API] Note saved successfully');
        return NextResponse.json(note);
    } catch (e: unknown) {
        console.error('[API] POST /api/notes error:', e);
        return errorResponse(e, 500);
    }
}
