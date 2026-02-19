import { pgTable, text, bigint } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
    id: text('id').primaryKey(),
    title: text('title').notNull().default('Untitled Note'),
    content: text('content').notNull().default(''),
    tags: text('tags').notNull().default('[]'), // JSON array of strings
    shareToken: text('share_token'),             // null = not shared
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    isPinned: text('is_pinned').notNull().default('false'), // Postgres doesn't always handle boolean defaults in Drizzle easily with strings, or we can use boolean('is_pinned').
    deletedAt: bigint('deleted_at', { mode: 'number' }),
});

export const settings = pgTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
