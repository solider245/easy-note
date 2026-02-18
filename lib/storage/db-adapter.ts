import type { StorageAdapter, Note, NoteMeta } from '../types';

/**
 * Stage 2 Database Adapter Placeholder.
 * Implement with Turso, Supabase or other SQL DB.
 */
export class DbAdapter implements StorageAdapter {
    async list(): Promise<NoteMeta[]> {
        throw new Error('Database adapter not implemented yet. Please add implementation to lib/storage/db-adapter.ts');
    }
    async get(id: string): Promise<Note | null> {
        throw new Error('Database adapter not implemented yet.');
    }
    async save(note: Note): Promise<void> {
        throw new Error('Database adapter not implemented yet.');
    }
    async del(id: string): Promise<void> {
        throw new Error('Database adapter not implemented yet.');
    }
    async exportAll(): Promise<Note[]> {
        throw new Error('Database adapter not implemented yet.');
    }
}
