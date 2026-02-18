import { list, put, del } from '@vercel/blob';
import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

/** Strip markdown syntax and return plain text preview */
function getPreview(content: string, maxLen = 120): string {
    return content
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/[*_`~>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLen);
}

function getWordCount(content: string): number {
    const text = content.replace(/[#*_`~\[\]()>]/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

function noteToMeta(data: any): NoteMeta {
    return {
        id: data.id,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isPinned: data.isPinned || false,
        deletedAt: data.deletedAt || null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        preview: data.content ? getPreview(data.content) : undefined,
        wordCount: data.content ? getWordCount(data.content) : undefined,
    };
}

export class BlobAdapter implements StorageAdapter {
    private readonly prefix = 'notes/';

    async list(): Promise<NoteMeta[]> {
        const { blobs } = await list({ prefix: this.prefix });
        if (blobs.length === 0) {
            const welcome = getWelcomeNote();
            return [{
                ...welcome,
                preview: getPreview(welcome.content),
                wordCount: getWordCount(welcome.content),
                tags: [],
            }];
        }

        const notes: NoteMeta[] = [];

        for (const blob of blobs) {
            try {
                const response = await fetch(blob.url);
                const data = await response.json();
                notes.push(noteToMeta(data));
            } catch {
                // skip corrupted blobs
            }
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
        const lowerQuery = query.toLowerCase();
        const results: NoteMeta[] = [];
        const { blobs } = await list({ prefix: this.prefix });

        for (const blob of blobs) {
            try {
                const response = await fetch(blob.url);
                const data = await response.json();
                if (
                    !data.deletedAt &&
                    (
                        data.title?.toLowerCase().includes(lowerQuery) ||
                        data.content?.toLowerCase().includes(lowerQuery) ||
                        (Array.isArray(data.tags) && data.tags.some((t: string) => t.includes(lowerQuery)))
                    )
                ) {
                    results.push(noteToMeta(data));
                }
            } catch {
                // skip
            }
        }

        return results.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
        });
    }

    async get(id: string): Promise<Note | null> {
        try {
            const { blobs } = await list({ prefix: `${this.prefix}${id}.json` });
            if (blobs.length === 0) {
                if (id === WELCOME_NOTE_ID) return getWelcomeNote();
                return null;
            }

            const response = await fetch(blobs[0].url);
            const data = await response.json();
            return {
                ...data,
                tags: Array.isArray(data.tags) ? data.tags : [],
            };
        } catch {
            if (id === WELCOME_NOTE_ID) return getWelcomeNote();
            return null;
        }
    }

    async save(note: Note): Promise<void> {
        const path = `${this.prefix}${note.id}.json`;
        const data = {
            ...note,
            tags: note.tags || [],
        };
        await put(path, JSON.stringify(data), {
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
        const { blobs } = await list();
        const used = blobs.reduce((acc, blob) => acc + blob.size, 0);
        return { used, total: 250 * 1024 * 1024 };
    }

    async exportAll(): Promise<Note[]> {
        const { blobs } = await list({ prefix: this.prefix });
        const notes: Note[] = [];
        for (const blob of blobs) {
            try {
                const response = await fetch(blob.url);
                const note = await response.json();
                if (note && note.id) {
                    notes.push({ ...note, tags: Array.isArray(note.tags) ? note.tags : [] });
                }
            } catch {
                // skip corrupted blobs
            }
        }
        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }
}
