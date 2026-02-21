import { pgTable, text, bigint } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
    id: text('id').primaryKey(),
    title: text('title').notNull().default('Untitled Note'),
    content: text('content').notNull().default(''),
    tags: text('tags').notNull().default('[]'), // JSON array of strings
    shareToken: text('share_token'),             // null = not shared
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    isPinned: text('is_pinned').notNull().default('false'),
    deletedAt: bigint('deleted_at', { mode: 'number' }),

    // v1.1.0: 22 one-line database enhancements
    // Statistics
    word_count: bigint('word_count', { mode: 'number' }).default(0),
    char_count: bigint('char_count', { mode: 'number' }).default(0),
    read_time_minutes: bigint('read_time_minutes', { mode: 'number' }).default(0),
    view_count: bigint('view_count', { mode: 'number' }).default(0),
    edit_count: bigint('edit_count', { mode: 'number' }).default(0),

    // Content analysis
    code_blocks: bigint('code_blocks', { mode: 'number' }).default(0),
    image_count: bigint('image_count', { mode: 'number' }).default(0),
    link_count: bigint('link_count', { mode: 'number' }).default(0),
    content_hash: text('content_hash'),
    cover_image: text('cover_image'),
    first_paragraph: text('first_paragraph'),

    // Metadata
    language: text('language').default('zh'),
    note_type: text('note_type').default('article'),
    folder_path: text('folder_path').default('/'),
    metadata: text('metadata').default('{}'),

    // Organization
    sort_order: bigint('sort_order', { mode: 'number' }).default(0),
    is_starred: text('is_starred').default('false'),
    status: text('status').default('draft'),
    priority: bigint('priority', { mode: 'number' }).default(0),

    // Audit
    last_viewed_at: bigint('last_viewed_at', { mode: 'number' }),
    updated_device: text('updated_device'),
    version: bigint('version', { mode: 'number' }).default(1),

    // v1.3.0: Archive system
    archived_at: bigint('archived_at', { mode: 'number' }),
});

export const settings = pgTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
