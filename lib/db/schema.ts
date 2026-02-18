import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(),
    title: text('title').notNull().default('Untitled Note'),
    content: text('content').notNull().default(''),
    tags: text('tags').notNull().default('[]'), // JSON array of strings
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
