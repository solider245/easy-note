import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

export class MemoryAdapter implements StorageAdapter {
    private notes: Map<string, Note> = new Map();

    async list(): Promise<NoteMeta[]> {
        if (this.notes.size === 0) {
            const welcome = getWelcomeNote();
            return [{ id: welcome.id, title: welcome.title, createdAt: welcome.createdAt, updatedAt: welcome.updatedAt }];
        }
        return Array.from(this.notes.values())
            .map(({ content, ...meta }) => meta)
            .sort((a, b) => b.updatedAt - a.updatedAt);
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

    async del(id: string): Promise<void> {
        this.notes.delete(id);
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        // Just a mock value
        return { used: 0, total: 250 * 1024 * 1024 };
    }

    async exportAll(): Promise<Note[]> {
        return Array.from(this.notes.values());
    }
}
