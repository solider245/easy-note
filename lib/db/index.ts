import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type AnyDrizzle = LibSQLDatabase<Record<string, never>> | PostgresJsDatabase<Record<string, never>>;

let _db: AnyDrizzle | null = null;

export async function getDb(): Promise<AnyDrizzle> {
    if (_db) return _db;

    const url = process.env.DATABASE_URL!;

    if (url.startsWith('libsql://') || url.startsWith('file:')) {
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

    return _db;
}
