import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql as drizzleSql } from 'drizzle-orm';

type AnyDrizzle = LibSQLDatabase<any> | PostgresJsDatabase<any>;

let _db: AnyDrizzle | null = null;
let _initialized = false;

export async function getDb(): Promise<AnyDrizzle> {
    if (_db && _initialized) return _db;

    const url = process.env.DATABASE_URL!;
    const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

    if (!_db) {
        if (isSQLite) {
            const { createClient } = await import('@libsql/client');
            const { drizzle } = await import('drizzle-orm/libsql');
            const client = createClient({
                url,
                authToken: process.env.DATABASE_AUTH_TOKEN,
            });
            _db = drizzle(client);
        } else {
            const postgres = (await import('postgres')).default;
            const { drizzle } = await import('drizzle-orm/postgres-js');
            const client = postgres(url);
            _db = drizzle(client);
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
                    updated_at INTEGER NOT NULL,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    deleted_at INTEGER
                )
            `);
            // Migrations for existing tables
            try { await client.execute(`ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN deleted_at INTEGER`); } catch (e) { }
            await client.execute(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
        } else {
            const postgresDb = db as PostgresJsDatabase<any>;
            await postgresDb.execute(drizzleSql`
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT 'Untitled Note',
                    content TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '[]',
                    created_at BIGINT NOT NULL,
                    updated_at BIGINT NOT NULL,
                    is_pinned TEXT NOT NULL DEFAULT 'false',
                    deleted_at BIGINT
                )
            `);
            // Migrations for existing tables
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned TEXT NOT NULL DEFAULT 'false'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at BIGINT`); } catch (e) { }
            await postgresDb.execute(drizzleSql`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
        }
        console.log('Database initialized successfully.');
    } catch (e) {
        console.error('Failed to initialize database tables:', e);
    }
}
