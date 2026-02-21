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
    const isPinned = Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true');
    const isStarred = Boolean(r.is_starred === 1 || r.is_starred === true || r.is_starred === 'true');

    return {
        id: r.id,
        title: r.title,
        createdAt: Number(r.createdAt),
        updatedAt: Number(r.updatedAt),
        isPinned,
        deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
        tags,
        shareToken: r.shareToken || null,
        preview: content !== undefined ? getPreview(content) : (r.content ? getPreview(r.content) : undefined),
        wordCount: content !== undefined ? getWordCount(content) : (r.content ? getWordCount(r.content) : undefined),

        // v1.1.0: 22 one-line database enhancements
        word_count: r.word_count ?? 0,
        char_count: r.char_count ?? 0,
        read_time_minutes: r.read_time_minutes ?? 0,
        view_count: r.view_count ?? 0,
        edit_count: r.edit_count ?? 0,

        code_blocks: r.code_blocks ?? 0,
        image_count: r.image_count ?? 0,
        link_count: r.link_count ?? 0,
        content_hash: r.content_hash,
        cover_image: r.cover_image,
        first_paragraph: r.first_paragraph,

        language: r.language ?? 'zh',
        note_type: r.note_type ?? 'article',
        folder_path: r.folder_path ?? '/',
        metadata: r.metadata ?? '{}',

        sort_order: r.sort_order ?? 0,
        is_starred: isStarred,
        status: r.status ?? 'draft',
        priority: r.priority ?? 0,

        last_viewed_at: r.last_viewed_at ? Number(r.last_viewed_at) : null,
        updated_device: r.updated_device,
        version: r.version ?? 1,
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
        const isPinned = Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true');
        const isStarred = Boolean(r.is_starred === 1 || r.is_starred === true || r.is_starred === 'true');

        return {
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: Number(r.createdAt),
            updatedAt: Number(r.updatedAt),
            isPinned,
            deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
            tags: parseTags(r.tags),

            // v1.1.0: 22 one-line database enhancements
            word_count: r.word_count ?? 0,
            char_count: r.char_count ?? 0,
            read_time_minutes: r.read_time_minutes ?? 0,
            view_count: r.view_count ?? 0,
            edit_count: r.edit_count ?? 0,

            code_blocks: r.code_blocks ?? 0,
            image_count: r.image_count ?? 0,
            link_count: r.link_count ?? 0,
            content_hash: r.content_hash,
            cover_image: r.cover_image,
            first_paragraph: r.first_paragraph,

            language: r.language ?? 'zh',
            note_type: r.note_type ?? 'article',
            folder_path: r.folder_path ?? '/',
            metadata: r.metadata ?? '{}',

            sort_order: r.sort_order ?? 0,
            is_starred: isStarred,
            status: r.status ?? 'draft',
            priority: r.priority ?? 0,

            last_viewed_at: r.last_viewed_at ? Number(r.last_viewed_at) : null,
            updated_device: r.updated_device,
            version: r.version ?? 1,
        };
    }

    async save(note: Note): Promise<void> {
        const db = await getDb();
        const { notes } = await getSchema();
        const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
        const sqlite = isSQLiteUrl(dbUrl);

        const tagsJson = JSON.stringify(note.tags || []);
        const metadataJson = typeof note.metadata === 'string' ? note.metadata : JSON.stringify(note.metadata || {});

        const values = {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: tagsJson,
            shareToken: note.shareToken ?? null,
            createdAt: note.createdAt as any,
            updatedAt: note.updatedAt as any,
            isPinned: sqlite ? (note.isPinned ? 1 : 0) : String(note.isPinned),
            deletedAt: note.deletedAt as any,

            // v1.1.0: 22 one-line database enhancements
            word_count: note.word_count ?? 0,
            char_count: note.char_count ?? 0,
            read_time_minutes: note.read_time_minutes ?? 0,
            view_count: note.view_count ?? 0,
            edit_count: note.edit_count ?? 0,

            code_blocks: note.code_blocks ?? 0,
            image_count: note.image_count ?? 0,
            link_count: note.link_count ?? 0,
            content_hash: note.content_hash ?? null,
            cover_image: note.cover_image ?? null,
            first_paragraph: note.first_paragraph ?? null,

            language: note.language ?? 'zh',
            note_type: note.note_type ?? 'article',
            folder_path: note.folder_path ?? '/',
            metadata: metadataJson,

            sort_order: note.sort_order ?? 0,
            is_starred: sqlite ? (note.is_starred ? 1 : 0) : String(note.is_starred ?? false),
            status: note.status ?? 'draft',
            priority: note.priority ?? 0,

            last_viewed_at: note.last_viewed_at as any,
            updated_device: note.updated_device ?? null,
            version: (note.version ?? 0) + 1,
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

                word_count: values.word_count,
                char_count: values.char_count,
                read_time_minutes: values.read_time_minutes,
                view_count: values.view_count,
                edit_count: values.edit_count,

                code_blocks: values.code_blocks,
                image_count: values.image_count,
                link_count: values.link_count,
                content_hash: values.content_hash,
                cover_image: values.cover_image,
                first_paragraph: values.first_paragraph,

                language: values.language,
                note_type: values.note_type,
                folder_path: values.folder_path,
                metadata: values.metadata,

                sort_order: values.sort_order,
                is_starred: values.is_starred,
                status: values.status,
                priority: values.priority,

                updated_device: values.updated_device,
                version: values.version,
            },
        });
    }

    async search(query: string): Promise<NoteMeta[]> {
        const db = await getDb();
        const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
        const isSQLite = isSQLiteUrl(dbUrl);

        if (isSQLite) {
            // SQLite FTS5 search
            return this.searchSQLiteFTS(db, query);
        } else {
            // PostgreSQL tsvector search
            return this.searchPostgresFTS(db, query);
        }
    }

    private async searchSQLiteFTS(db: any, query: string): Promise<NoteMeta[]> {
        // Use FTS5 for full-text search with ranking
        const ftsQuery = query.split(/\s+/).filter(Boolean).map(term => `"${term}"`).join(' AND ');
        
        const result = await db.execute(`
            SELECT n.*, rank
            FROM notes_fts
            JOIN notes n ON notes_fts.rowid = n.rowid
            WHERE notes_fts MATCH ? AND n.deleted_at IS NULL
            ORDER BY rank
            LIMIT 100
        `, [ftsQuery]);

        return (result.rows || []).map((r: any) => rowToMeta(r, r.content));
    }

    private async searchPostgresFTS(db: any, query: string): Promise<NoteMeta[]> {
        // Use PostgreSQL tsvector with ranking
        const result = await db.execute(`
            SELECT n.*, 
                   ts_rank_cd(search_vector, plainto_tsquery('simple', $1), 32) AS rank
            FROM notes n
            WHERE search_vector @@ plainto_tsquery('simple', $1)
              AND deleted_at IS NULL
            ORDER BY rank DESC, updated_at DESC
            LIMIT 100
        `, [query]);

        return (result.rows || []).map((r: any) => rowToMeta(r, r.content));
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
        return (rows as any[]).map((r) => {
            const isPinned = Boolean(r.isPinned === 1 || r.isPinned === true || r.isPinned === 'true');
            const isStarred = Boolean(r.is_starred === 1 || r.is_starred === true || r.is_starred === 'true');

            return {
                id: r.id,
                title: r.title,
                content: r.content,
                createdAt: Number(r.createdAt),
                updatedAt: Number(r.updatedAt),
                isPinned,
                deletedAt: r.deletedAt ? Number(r.deletedAt) : null,
                tags: parseTags(r.tags),

                // v1.1.0: 22 one-line database enhancements
                word_count: r.word_count ?? 0,
                char_count: r.char_count ?? 0,
                read_time_minutes: r.read_time_minutes ?? 0,
                view_count: r.view_count ?? 0,
                edit_count: r.edit_count ?? 0,

                code_blocks: r.code_blocks ?? 0,
                image_count: r.image_count ?? 0,
                link_count: r.link_count ?? 0,
                content_hash: r.content_hash,
                cover_image: r.cover_image,
                first_paragraph: r.first_paragraph,

                language: r.language ?? 'zh',
                note_type: r.note_type ?? 'article',
                folder_path: r.folder_path ?? '/',
                metadata: r.metadata ?? '{}',

                sort_order: r.sort_order ?? 0,
                is_starred: isStarred,
                status: r.status ?? 'draft',
                priority: r.priority ?? 0,

                last_viewed_at: r.last_viewed_at ? Number(r.last_viewed_at) : null,
                updated_device: r.updated_device,
                version: r.version ?? 1,
            };
        });
    }
}
