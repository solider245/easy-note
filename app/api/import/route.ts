import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { Note } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const notes = await req.json();

        if (!Array.isArray(notes)) {
            return NextResponse.json({ error: 'Invalid format. Expected an array of notes.' }, { status: 400 });
        }

        const storage = await getStorage();
        let successCount = 0;
        let failCount = 0;

        for (const note of notes as Note[]) {
            try {
                // Basic validation
                if (!note.id || !note.title) continue;

                await storage.save({
                    ...note,
                    createdAt: note.createdAt || Date.now(),
                    updatedAt: note.updatedAt || Date.now(),
                    isPinned: !!note.isPinned,
                    deletedAt: note.deletedAt || null
                });
                successCount++;
            } catch (e) {
                console.error(`Failed to import note ${note.id}:`, e);
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import completed: ${successCount} notes imported, ${failCount} failed.`,
            stats: { success: successCount, failed: failCount }
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to process import: ' + e.message }, { status: 500 });
    }
}
