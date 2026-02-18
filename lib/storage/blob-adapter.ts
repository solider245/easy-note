import { list, put, del } from '@vercel/blob';
import type { StorageAdapter, Note, NoteMeta } from '../types';

export class BlobAdapter implements StorageAdapter {
    private readonly prefix = 'notes/';

    async list(): Promise<NoteMeta[]> {
        const { blobs } = await list({ prefix: this.prefix });
        const notes: NoteMeta[] = [];

        for (const blob of blobs) {
            // Each blob is notes/{id}.json
            // To get title and timestamps, we could either fetch each file (slow)
            // or encode metadata in the filename, or use a separate index.
            // For MVP with small # of notes, we catch title from content or metadata.
            // Optimization: fetch them in parallel.
            const id = blob.pathname.replace(this.prefix, '').replace('.json', '');

            // Let's fetch the metadata. In a real app, we'd use a more efficient index.
            const response = await fetch(blob.url);
            const data = await response.json();
            notes.push({
                id: data.id,
                title: data.title,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            });
        }

        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async get(id: string): Promise<Note | null> {
        try {
            const { blobs } = await list({ prefix: `${this.prefix}${id}.json` });
            if (blobs.length === 0) return null;

            const response = await fetch(blobs[0].url);
            return await response.json();
        } catch (e) {
            return null;
        }
    }

    async save(note: Note): Promise<void> {
        const path = `${this.prefix}${note.id}.json`;
        await put(path, JSON.stringify(note), {
            access: 'public',
            addRandomSuffix: false,
        });
    }

    async del(id: string): Promise<void> {
        const { blobs } = await list({ prefix: `${this.prefix}${id}.json` });
        if (blobs.length > 0) {
            await del(blobs[0].url);
        }
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        // Vercel Blob doesn't have a direct usage API in the SDK yet that returns "total"
        // We can sum up the sizes of listed blobs for "used".
        // Total for free tier is 250MB.
        const { blobs } = await list();
        const used = blobs.reduce((acc, blob) => acc + blob.size, 0);
        return { used, total: 250 * 1024 * 1024 }; // 250MB
    }

    async exportAll(): Promise<Note[]> {
        const metas = await this.list();
        const notes: Note[] = [];
        for (const meta of metas) {
            const note = await this.get(meta.id);
            if (note) notes.push(note);
        }
        return notes;
    }
}
