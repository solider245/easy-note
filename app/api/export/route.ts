import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET() {
    try {
        const storage = await getStorage();
        const allNotes = await storage.exportAll();

        return new NextResponse(JSON.stringify(allNotes, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="easy-notes-backup.json"',
            },
        });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
