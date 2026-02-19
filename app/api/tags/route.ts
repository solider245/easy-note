import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

// GET /api/tags → return all tags with note counts
export async function GET() {
    try {
        const storage = await getStorage();
        const notes = await storage.list();

        const tagCounts: Record<string, number> = {};
        for (const note of notes) {
            for (const tag of note.tags || []) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }

        const tags = Object.entries(tagCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        return NextResponse.json(tags);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
