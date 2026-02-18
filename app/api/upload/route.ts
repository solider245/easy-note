import { NextRequest, NextResponse } from 'next/server';
import { getMediaStorage } from '@/lib/media';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mediaStorage = await getMediaStorage();

        // Create a unique filename
        const ext = file.name.split('.').pop();
        const filename = `${nanoid()}.${ext}`;

        const url = await mediaStorage.upload(buffer, filename, file.type);

        return NextResponse.json({ url });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
