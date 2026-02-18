import { list, put, del } from '@vercel/blob';
import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

export class BlobAdapter implements StorageAdapter {
    private readonly prefix = 'notes/';

    async list(): Promise<NoteMeta[]> {
        const { blobs } = await list({ prefix: this.prefix });
        if (blobs.length === 0) {
            const welcome = getWelcomeNote();
            return [{ ...welcome, isPinned: false, deletedAt: null }];
        }

        const notes: NoteMeta[] = [];

        for (const blob of blobs) {
            const response = await fetch(blob.url);
            const data = await response.json();
            notes.push({
                id: data.id,
                title: data.title,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                isPinned: data.isPinned || false,
                deletedAt: data.deletedAt || null,
            });
        }

        return notes
            .filter(n => !n.deletedAt)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.updatedAt - a.updatedAt;
            });
    }

    async search(query: string): Promise<NoteMeta[]> {
        const all = await this.list();
        const lowerQuery = query.toLowerCase();
        // Since list() already fetches the full content (inefficiently for blob), we can filter here.
        // Actually list() here ONLY returns NoteMeta. 
        // For BlobAdapter, we'd need to fetch actual notes to search body.
        const results: NoteMeta[] = [];
        for (const meta of all) {
            const note = await this.get(meta.id);
            if (note && (note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery))) {
                results.push(meta);
            }
        }
        return results;
    }

    async get(id: string): Promise<Note | null> {
        try {
            const { blobs } = await list({ prefix: `${this.prefix}${id}.json` });
            if (blobs.length === 0) {
                if (id === WELCOME_NOTE_ID) return getWelcomeNote();
                return null;
            }

            const response = await fetch(blobs[0].url);
            return await response.json();
        } catch {
            if (id === WELCOME_NOTE_ID) return getWelcomeNote();
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

    async del(id: string, purge?: boolean): Promise<void> {
        if (purge) {
            const { blobs } = await list({ prefix: `${this.prefix}${id}.json` });
            if (blobs.length > 0) {
                await del(blobs[0].url);
            }
        } else {
            const note = await this.get(id);
            if (note) {
                note.deletedAt = Date.now();
                await this.save(note);
            }
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
        // Fetch ALL blobs including deleted ones (list() filters out deleted)
        const { blobs } = await list({ prefix: this.prefix });
        const notes: Note[] = [];
        for (const blob of blobs) {
            try {
                const response = await fetch(blob.url);
                const note = await response.json();
                if (note && note.id) notes.push(note);
            } catch {
                // skip corrupted blobs
            }
        }
        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }
}
