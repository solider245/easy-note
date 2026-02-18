import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type AnyDrizzle = LibSQLDatabase<Record<string, never>> | PostgresJsDatabase<Record<string, never>>;

let _db: AnyDrizzle | null = null;
let _initialized = false;

export async function getDb(): Promise<AnyDrizzle> {
    if (_db && _initialized) return _db;

    const url = process.env.DATABASE_URL!;
    const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

    if (!_db) {
        if (isSQLite) {
            // Turso or local SQLite
            const { createClient } = await import('@libsql/client');
            const { drizzle } = await import('drizzle-orm/libsql');
            const client = createClient({
                url,
                authToken: process.env.DATABASE_AUTH_TOKEN,
            });
            _db = drizzle(client) as AnyDrizzle;
        } else {
            // Postgres (Supabase, Neon, etc.)
            const postgres = (await import('postgres')).default;
            const { drizzle } = await import('drizzle-orm/postgres-js');
            const client = postgres(url);
            _db = drizzle(client) as AnyDrizzle;
        }
    }

    if (!_initialized) {
        await initializeDb(_db, isSQLite);
        _initialized = true;
    }

    return _db;
}

async function initializeDb(db: AnyDrizzle, isSQLite: boolean) {
    console.log('Checking database initialization...');
    try {
        if (isSQLite) {
            const client = (db as any).$client;
            await client.execute(`
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT 'Untitled Note',
                    content TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '[]',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            await client.execute(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
        } else {
            // Postgres logic
            const { sql } = await import('drizzle-orm');
            await (db as any).execute(sql`
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT 'Untitled Note',
                    content TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '[]',
                    created_at BIGINT NOT NULL,
                    updated_at BIGINT NOT NULL
                )
            `);
            await (db as any).execute(sql`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
        }
        console.log('Database initialized successfully.');
    } catch (e) {
        console.error('Failed to initialize database tables:', e);
        // We don't throw here to avoid crashing the whole app, but the next query will fail if tables missing
    }
}
