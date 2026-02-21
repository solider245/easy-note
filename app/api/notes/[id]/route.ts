import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { calculateNoteStats, getDeviceInfo } from '@/lib/utils/note-stats';

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
        const { title, content, isPinned, tags, is_starred, status, priority, folder_path, note_type, metadata } = await request.json();

        const existing = await storage.get(id);
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const newTitle = title ?? existing.title;
        const newContent = content ?? existing.content;

        // Recalculate stats if content changed
        const stats = calculateNoteStats(newTitle, newContent);
        const contentChanged = newContent !== existing.content;

        const updatedNote = {
            ...existing,
            title: newTitle,
            content: newContent,
            isPinned: isPinned !== undefined ? isPinned : existing.isPinned,
            tags: tags !== undefined ? tags : (existing.tags || []),
            updatedAt: Date.now(),

            // v1.1.0: Recalculate statistics
            word_count: stats.word_count,
            char_count: stats.char_count,
            read_time_minutes: stats.read_time_minutes,
            edit_count: contentChanged ? (existing.edit_count || 0) + 1 : (existing.edit_count || 0),

            code_blocks: stats.code_blocks,
            image_count: stats.image_count,
            link_count: stats.link_count,
            content_hash: stats.content_hash,
            cover_image: stats.cover_image,
            first_paragraph: stats.first_paragraph,

            language: stats.language,
            note_type: note_type ?? existing.note_type ?? 'article',
            folder_path: folder_path ?? existing.folder_path ?? '/',
            metadata: metadata ?? existing.metadata ?? '{}',

            is_starred: is_starred !== undefined ? is_starred : (existing.is_starred || false),
            status: status ?? existing.status ?? 'draft',
            priority: priority !== undefined ? priority : (existing.priority || 0),
            sort_order: existing.sort_order || 0,

            updated_device: getDeviceInfo(),
            // Version is auto-incremented in storage layer
        };

        await storage.save(updatedNote as any);
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
