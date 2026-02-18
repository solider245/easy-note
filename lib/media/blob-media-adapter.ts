import { put, del, list } from '@vercel/blob';
import type { MediaAdapter } from '../types';

export class BlobMediaAdapter implements MediaAdapter {
    private readonly prefix = 'media/';

    async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
        const blob = await put(`${this.prefix}${filename}`, file, {
            access: 'public',
            contentType: mimeType,
        });
        return blob.url;
    }

    async del(url: string): Promise<void> {
        await del(url);
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        const { blobs } = await list();
        const used = blobs.reduce((acc, blob) => acc + blob.size, 0);
        return { used, total: 250 * 1024 * 1024 };
    }
}
