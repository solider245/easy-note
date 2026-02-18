import { NextRequest, NextResponse } from 'next/server';
import { getMediaStorage } from '@/lib/media';
import { nanoid } from 'nanoid';

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
]);

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: `File type "${file.type}" is not allowed. Only images are supported.` },
                { status: 415 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds the 10MB limit.` },
                { status: 413 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mediaStorage = await getMediaStorage();

        // Create a unique filename, sanitize extension from MIME type to avoid spoofing
        const mimeToExt: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/avif': 'avif',
        };
        const ext = mimeToExt[file.type] || 'bin';
        const filename = `${nanoid()}.${ext}`;

        const url = await mediaStorage.upload(buffer, filename, file.type);

        return NextResponse.json({ url });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
