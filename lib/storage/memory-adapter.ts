import type { StorageAdapter, Note, NoteMeta } from '../types';

export class MemoryAdapter implements StorageAdapter {
    private notes: Map<string, Note> = new Map();

    async list(): Promise<NoteMeta[]> {
        return Array.from(this.notes.values())
            .map(({ content, ...meta }) => meta)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async get(id: string): Promise<Note | null> {
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
