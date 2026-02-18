import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

/** Strip markdown syntax and return plain text preview */
function getPreview(content: string, maxLen = 120): string {
    return content
        .replace(/!\[.*?\]\(.*?\)/g, '') // images
        .replace(/\[.*?\]\(.*?\)/g, '$1') // links → text
        .replace(/#{1,6}\s+/g, '')        // headings
        .replace(/[*_`~>]/g, '')          // formatting chars
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLen);
}

function getWordCount(content: string): number {
    const text = content.replace(/[#*_`~\[\]()>]/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

function toMeta(note: Note): NoteMeta {
    const { content, ...meta } = note;
    return {
        ...meta,
        preview: getPreview(content),
        wordCount: getWordCount(content),
        tags: note.tags || [],
    };
}

export class MemoryAdapter implements StorageAdapter {
    private notes: Map<string, Note> = new Map();

    async list(): Promise<NoteMeta[]> {
        if (this.notes.size === 0) {
            const welcome = getWelcomeNote();
            return [toMeta(welcome)];
        }
        return Array.from(this.notes.values())
            .filter(n => !n.deletedAt)
            .map(toMeta)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.updatedAt - a.updatedAt;
            });
    }

    async search(query: string): Promise<NoteMeta[]> {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.notes.values())
            .filter(n => !n.deletedAt && (
                n.title.toLowerCase().includes(lowerQuery) ||
                n.content.toLowerCase().includes(lowerQuery) ||
                (n.tags || []).some(t => t.includes(lowerQuery))
            ))
            .map(toMeta)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.updatedAt - a.updatedAt;
            });
    }

    async get(id: string): Promise<Note | null> {
        if (id === WELCOME_NOTE_ID && !this.notes.has(id)) {
            return getWelcomeNote();
        }
        return this.notes.get(id) || null;
    }

    async save(note: Note): Promise<void> {
        this.notes.set(note.id, note);
    }

    async del(id: string, purge?: boolean): Promise<void> {
        if (purge) {
            this.notes.delete(id);
        } else {
            const note = this.notes.get(id);
            if (note) {
                note.deletedAt = Date.now();
                this.notes.set(id, note);
            }
        }
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        return { used: 0, total: 250 * 1024 * 1024 };
    }

    async exportAll(): Promise<Note[]> {
        return Array.from(this.notes.values());
    }
}
