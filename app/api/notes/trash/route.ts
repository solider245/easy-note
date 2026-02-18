import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET() {
    try {
        const storage = await getStorage();
        // We need a way to list only deleted notes. 
        // Current storage.list() filters out deleted ones.
        // I should probably add a parameter to list() or create a dedicated method.
        // For now, I'll use exportAll() and filter manually since it's cleaner than modifying the interface again.
        const allNotes = await storage.exportAll();
        const trashedNotes = allNotes.filter(n => n.deletedAt !== null);

        return NextResponse.json(trashedNotes);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
