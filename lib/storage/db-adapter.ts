import type { StorageAdapter, Note, NoteMeta } from '../types';
import { getDb } from '../db';
import { getWelcomeNote, WELCOME_NOTE_ID } from '../welcome-note';

// We use dynamic imports for schemas to avoid loading both at startup
async function getSchema() {
    const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
    if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('file:') || !dbUrl.includes('://')) {
        return await import('../db/schema');
    } else {
        return await import('../db/schema.pg');
    }
}

function isSQLiteUrl(url: string): boolean {
    return url.startsWith('libsql://') || url.startsWith('file:') || !url.includes('://');
}

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

function parseTags(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}

function rowToMeta(r: any, content?: string): NoteMeta {
    const tags = parseTags(r.tags);
    return {
        id: r.id,
        title: r.title,
        createdAt: Number(r.createdAt),
        updatedAt: Number(r.updatedAt),
        isPinned: Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true'),
        deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        tags,
        shareToken: r.shareToken || null,
        preview: content !== undefined ? getPreview(content) : (r.content ? getPreview(r.content) : undefined),
        wordCount: content !== undefined ? getWordCount(content) : (r.content ? getWordCount(r.content) : undefined),
    };
}

export class DbAdapter implements StorageAdapter {
    async list(): Promise<NoteMeta[]> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { desc, isNull } = await import('drizzle-orm');

        const rows = await (db as any).select({
            id: notes.id,
            title: notes.title,
            content: notes.content,
            tags: notes.tags,
            shareToken: notes.shareToken,
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
            return [{
                ...welcome,
                preview: getPreview(welcome.content),
                wordCount: getWordCount(welcome.content),
                tags: [],
            }];
        }

        return (rows as any[]).map(r => rowToMeta(r, r.content));
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
            tags: parseTags(r.tags),
        };
    }

    async save(note: Note): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
        const sqlite = isSQLiteUrl(dbUrl);

        const tagsJson = JSON.stringify(note.tags || []);

        const values = {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: tagsJson,
            shareToken: note.shareToken ?? null,
            createdAt: note.createdAt as any,
            updatedAt: note.updatedAt as any,
            isPinned: sqlite ? (note.isPinned ? 1 : 0) : note.isPinned,
            deletedAt: note.deletedAt as any,
        };

        await (db as any).insert(notes).values(values).onConflictDoUpdate({
            target: notes.id,
            set: {
                title: note.title,
                content: note.content,
                tags: tagsJson,
                shareToken: note.shareToken ?? null,
                updatedAt: note.updatedAt,
                isPinned: values.isPinned,
                deletedAt: values.deletedAt,
            },
        });
    }

    async search(query: string): Promise<NoteMeta[]> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { desc, isNull, and, or, like } = await import('drizzle-orm');

        const searchPattern = `%${query}%`;
        const rows = await (db as any).select({
            id: notes.id,
            title: notes.title,
            content: notes.content,
            tags: notes.tags,
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
                        like(notes.content, searchPattern),
                        like(notes.tags, searchPattern)
                    )
                )
            )
            .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

        return (rows as any[]).map(r => rowToMeta(r, r.content));
    }

    async del(id: string, purge?: boolean): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const { eq } = await import('drizzle-orm');

        if (purge) {
            await (db as any).delete(notes).where(eq(notes.id, id));
        } else {
            await (db as any).update(notes).set({ deletedAt: Date.now() }).where(eq(notes.id, id));
        }
    }

    async getUsage(): Promise<{ used: number; total: number }> {
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
            tags: parseTags(r.tags),
        }));
    }
}
