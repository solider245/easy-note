import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export async function GET() {
    try {
        const storage = await getStorage();
        const allNotes = await storage.exportAll();
        const now = Date.now();

        // Auto-purge notes that have been in trash for more than 30 days
        const expiredNotes = allNotes.filter(
            (n) => n.deletedAt !== null && now - n.deletedAt > TRASH_RETENTION_MS
        );
        await Promise.all(expiredNotes.map((n) => storage.del(n.id, true)));

        // Return remaining trashed notes with days-remaining info
        const trashedNotes = allNotes
            .filter((n) => n.deletedAt !== null && now - n.deletedAt <= TRASH_RETENTION_MS)
            .map((n) => ({
                ...n,
                daysUntilPurge: Math.ceil((TRASH_RETENTION_MS - (now - n.deletedAt!)) / (24 * 60 * 60 * 1000)),
            }));

        return NextResponse.json(trashedNotes);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
