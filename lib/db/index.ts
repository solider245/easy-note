import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql as drizzleSql } from 'drizzle-orm';

type AnyDrizzle = LibSQLDatabase<any> | PostgresJsDatabase<any>;

let _db: AnyDrizzle | null = null;
let _initialized = false;

export async function getDb(): Promise<AnyDrizzle> {
    if (_db && _initialized) return _db;

    const { configService } = await import('../config/config-service');
    const url = await configService.get('DATABASE_URL') || await configService.get('TURSO_DATABASE_URL');

    if (!url) {
        throw new Error('No database URL found');
    }
    const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');

    if (!_db) {
        if (isSQLite) {
            // Ensure directory exists for file: URLs
            if (url.startsWith('file:')) {
                try {
                    const { existsSync, mkdirSync } = await import('fs');
                    const { dirname } = await import('path');
                    const filePath = url.replace('file:', '');
                    let dir = dirname(filePath);
                    if (!existsSync(dir)) {
                        mkdirSync(dir, { recursive: true });
                    }
                } catch (e) {
                    console.error('Failed to ensure database directory exists:', e);
                }
            }

            const { createClient } = await import('@libsql/client');
            const { drizzle } = await import('drizzle-orm/libsql');
            const client = createClient({
                url,
                authToken: await configService.get('DATABASE_AUTH_TOKEN') || await configService.get('TURSO_AUTH_TOKEN'),
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

/**
 * Reset and reinitialize database connection
 * Used when switching database configuration at runtime
 */
export async function resetDatabaseConnection(): Promise<void> {
    // Note: In serverless environments like Vercel, we can't reliably close connections
    // as they may be shared across requests. We simply reset our internal state
    // and let the next request create a new connection.
    
    _db = null;
    _initialized = false;

    // Clear module cache for config service to force re-read
    const { configService } = await import('../config/config-service');
    configService.clearCache();

    console.log('Database connection reset. Will reinitialize on next getDb() call.');
}

/**
 * Test database connection without initializing tables
 * Used for connection testing in settings
 */
export async function testDatabaseConnection(
    url: string,
    authToken?: string
): Promise<{ success: boolean; message: string; latency?: number }> {
    const start = Date.now();
    
    try {
        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
        
        if (isSQLite) {
            const { createClient } = await import('@libsql/client');
            const client = createClient({
                url,
                authToken,
            });
            
            // Test connection with a simple query
            await client.execute('SELECT 1');
            
            const latency = Date.now() - start;
            return {
                success: true,
                message: `Connected to Turso successfully (${latency}ms)`,
                latency
            };
        } else {
            const postgres = (await import('postgres')).default;
            const client = postgres(url, {
                max: 1, // Single connection for testing
                idle_timeout: 5,
                connect_timeout: 5,
            });
            
            // Test connection
            await client`SELECT 1`;
            
            // Close test connection
            await client.end();
            
            const latency = Date.now() - start;
            return {
                success: true,
                message: `Connected to PostgreSQL successfully (${latency}ms)`,
                latency
            };
        }
    } catch (error) {
        const latency = Date.now() - start;
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed',
            latency
        };
    }
}
