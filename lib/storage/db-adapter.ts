import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getDb } from '../db';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

// We use dynamic imports for schemas to avoid loading both at startup
async function getSchema() {
    const { configService } = await import('../config/config-service');
    const url = await configService.get('DATABASE_URL') || await configService.get('TURSO_DATABASE_URL') || '';
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
        const { eq, desc, and, isNull } = await import('drizzle-orm');

        const rows = await (db as any).select({
            id: notes.id,
            title: notes.title,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
            isPinned: notes.isPinned,
            deletedAt: notes.deletedAt,
        })
            .from(notes)
            .where(isNull(notes.deletedAt))
            .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

        if (rows.length === 0) {
            const welcome = getWelcomeNote();
            return [{ ...welcome, isPinned: false, deletedAt: null }];
        }

        return (rows as any[]).map((r) => ({
            id: r.id,
            title: r.title,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
            isPinned: Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true'),
            deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        }));
    }

    async get(id: string): Promise<Note | null> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq } = await import('drizzle-orm');

        const rows = await (db as any).select().from(notes).where(eq(notes.id, id)).limit(1);

        if (rows.length === 0) {
            if (id === WELCOME_NOTE_ID) return getWelcomeNote();
            return null;
        }

        const r = rows[0] as any;
        return {
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
            isPinned: Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true'),
            deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        };
    }

    async save(note: Note): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { configService } = await import('../config/config-service');
        const url = await configService.get('DATABASE_URL') || await configService.get('TURSO_DATABASE_URL') || '';
        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

        const values = {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: '[]',
            createdAt: note.createdAt as any,
            updatedAt: note.updatedAt as any,
            isPinned: isSQLite ? (note.isPinned ? 1 : 0) : (note.isPinned ? 'true' : 'false'),
            deletedAt: note.deletedAt as any,
        };

        if (isSQLite) {
            await (db as any).insert(notes).values(values).onConflictDoUpdate({
                target: notes.id,
                set: {
                    title: note.title,
                    content: note.content,
                    updatedAt: note.updatedAt,
                    isPinned: values.isPinned,
                    deletedAt: values.deletedAt,
                },
            });
        } else {
            // PostgreSQL upsert
            await (db as any).insert(notes).values(values).onConflictDoUpdate({
                target: notes.id,
                set: {
                    title: note.title,
                    content: note.content,
                    updatedAt: note.updatedAt,
                    isPinned: values.isPinned,
                    deletedAt: values.deletedAt,
                },
            });
        }
    }

    async search(query: string): Promise<NoteMeta[]> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq, desc, and, isNull, or, like } = await import('drizzle-orm');

        const searchPattern = `%${query}%`;
        const rows = await (db as any).select({
            id: notes.id,
            title: notes.title,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
            isPinned: notes.isPinned,
            deletedAt: notes.deletedAt,
        })
            .from(notes)
            .where(
                and(
                    isNull(notes.deletedAt),
                    or(
                        like(notes.title, searchPattern),
                        like(notes.content, searchPattern)
                    )
                )
            )
            .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

        return (rows as any[]).map((r) => ({
            id: r.id,
            title: r.title,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
            isPinned: Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true'),
            deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        }));
    }

    async del(id: string, purge?: boolean): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq } = await import('drizzle-orm');

        if (purge) {
            // Hard delete
            await (db as any).delete(notes).where(eq(notes.id, id));
        } else {
            // Soft delete
            await (db as any).update(notes).set({ deletedAt: Date.now() }).where(eq(notes.id, id));
        }
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
        return (rows as any[]).map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
            isPinned: Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true'),
            deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        }));
    }
}
