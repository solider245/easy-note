import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getDb } from '../db';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

// We use dynamic imports for schemas to avoid loading both at startup
async function getSchema() {
    const url = process.env.DATABASE_URL!;
    if (url.startsWith('libsql://') || url.startsWith('file:')) {
        return await import('../db/schema');
    } else {
        return await import('../db/schema.pg');
    }
}

export class DbAdapter implements StorageAdapter {
    async list(): Promise<NoteMeta[]> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq, desc } = await import('drizzle-orm');

        const rows = await (db as any).select({
            id: notes.id,
            title: notes.title,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
        }).from(notes).orderBy(desc(notes.updatedAt));

        if (rows.length === 0) {
            const welcome = getWelcomeNote();
            return [{ id: welcome.id, title: welcome.title, createdAt: welcome.createdAt, updatedAt: welcome.updatedAt }];
        }

        return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
        }));
    }

    async get(id: string): Promise<Note | null> {
        if (id === WELCOME_NOTE_ID) {
            // Check if it exists in DB first
        }

        const db = await getDb();
        const { notes } = await getSchema();
        const { eq } = await import('drizzle-orm');

        const rows = await (db as any).select().from(notes).where(eq(notes.id, id)).limit(1);

        if (rows.length === 0) {
            if (id === WELCOME_NOTE_ID) return getWelcomeNote();
            return null;
        }

        const r = rows[0];
        return {
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
        };
    }

    async save(note: Note): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();

        const url = process.env.DATABASE_URL!;
        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

        const values = {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: '[]',
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        };

        if (isSQLite) {
            const { sql } = await import('drizzle-orm');
            await (db as any).insert(notes).values(values).onConflictDoUpdate({
                target: notes.id,
                set: {
                    title: note.title,
                    content: note.content,
                    updatedAt: note.updatedAt,
                },
            });
        } else {
            // Postgres upsert
            const { sql } = await import('drizzle-orm');
            await (db as any).insert(notes).values(values).onConflictDoUpdate({
                target: notes.id,
                set: {
                    title: note.title,
                    content: note.content,
                    updatedAt: note.updatedAt,
                },
            });
        }
    }

    async del(id: string): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq } = await import('drizzle-orm');
        await (db as any).delete(notes).where(eq(notes.id, id));
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        // DB doesn't have a meaningful "usage" in MB for notes
        return { used: 0, total: Infinity };
    }

    async exportAll(): Promise<Note[]> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { desc } = await import('drizzle-orm');

        const rows = await (db as any).select().from(notes).orderBy(desc(notes.updatedAt));
        return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
        }));
    }
}
