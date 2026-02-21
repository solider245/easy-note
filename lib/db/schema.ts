import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(),
    title: text('title').notNull().default('Untitled Note'),
    content: text('content').notNull().default(''),
    tags: text('tags').notNull().default('[]'), // JSON array of strings
    shareToken: text('share_token'),             // null = not shared
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),

    // v1.1.0: 22 one-line database enhancements
    // Statistics
    word_count: integer('word_count').default(0),
    char_count: integer('char_count').default(0),
    read_time_minutes: integer('read_time_minutes').default(0),
    view_count: integer('view_count').default(0),
    edit_count: integer('edit_count').default(0),

    // Content analysis
    code_blocks: integer('code_blocks').default(0),
    image_count: integer('image_count').default(0),
    link_count: integer('link_count').default(0),
    content_hash: text('content_hash'),
    cover_image: text('cover_image'),
    first_paragraph: text('first_paragraph'),

    // Metadata
    language: text('language').default('zh'),
    note_type: text('note_type').default('article'),
    folder_path: text('folder_path').default('/'),
    metadata: text('metadata').default('{}'),

    // Organization
    sort_order: integer('sort_order').default(0),
    is_starred: integer('is_starred', { mode: 'boolean' }).default(false),
    status: text('status').default('draft'),
    priority: integer('priority').default(0),

    // Audit
    last_viewed_at: integer('last_viewed_at', { mode: 'timestamp_ms' }),
    updated_device: text('updated_device'),
    version: integer('version').default(1),
});

export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
