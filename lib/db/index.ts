import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql as drizzleSql } from 'drizzle-orm';

type AnyDrizzle = LibSQLDatabase<any> | PostgresJsDatabase<any>;

let _db: AnyDrizzle | null = null;
let _initialized = false;

export async function getDb(): Promise<AnyDrizzle> {
    if (_db && _initialized) {
        console.log('[DB] Returning cached database instance');
        return _db;
    }

    console.log('[DB] Initializing database connection...');
    const { configService } = await import('../config/config-service');
    const url = await configService.get('DATABASE_URL') || await configService.get('TURSO_DATABASE_URL');

    console.log('[DB] Database URL found:', url ? 'Yes' : 'No');
    
    if (!url) {
        throw new Error('No database URL found. Please configure DATABASE_URL or TURSO_DATABASE_URL environment variable.');
    }
    
    const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
    console.log('[DB] Database type:', isSQLite ? 'SQLite' : 'PostgreSQL');

    if (!_db) {
        if (isSQLite) {
            console.log('[DB] Creating SQLite connection...');
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
            console.log('[DB] SQLite connection created');
        } else {
            console.log('[DB] Creating PostgreSQL connection...');
            const postgres = (await import('postgres')).default;
            const { drizzle } = await import('drizzle-orm/postgres-js');
            console.log('[DB] Connecting to PostgreSQL:', url.substring(0, url.indexOf('@') + 1) + '***');
            const client = postgres(url);
            _db = drizzle(client);
            console.log('[DB] PostgreSQL connection created');
        }
    }

    if (!_initialized) {
        console.log('[DB] Initializing database schema...');
        await initializeDb(_db, isSQLite);
        _initialized = true;
        console.log('[DB] Database initialization complete');
    }

    console.log('[DB] Database ready');
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
                    share_token TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    deleted_at INTEGER
                )
            `);
            // Migrations for existing tables
            try { await client.execute(`ALTER TABLE notes ADD COLUMN share_token TEXT`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN deleted_at INTEGER`); } catch (e) { }
            
            // v1.1.0: 22 one-line database enhancements
            // Data statistics
            try { await client.execute(`ALTER TABLE notes ADD COLUMN word_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN char_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN read_time_minutes INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN view_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN edit_count INTEGER DEFAULT 0`); } catch (e) { }
            
            // Content analysis
            try { await client.execute(`ALTER TABLE notes ADD COLUMN code_blocks INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN image_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN link_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN content_hash TEXT`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN cover_image TEXT`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN first_paragraph TEXT`); } catch (e) { }
            
            // Metadata
            try { await client.execute(`ALTER TABLE notes ADD COLUMN language TEXT DEFAULT 'zh'`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN note_type TEXT DEFAULT 'article'`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN folder_path TEXT DEFAULT '/'`) } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN metadata TEXT DEFAULT '{}'`); } catch (e) { }
            
            // Organization
            try { await client.execute(`ALTER TABLE notes ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN is_starred INTEGER DEFAULT 0`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN status TEXT DEFAULT 'draft'`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN priority INTEGER DEFAULT 0`); } catch (e) { }
            
            // Audit
            try { await client.execute(`ALTER TABLE notes ADD COLUMN last_viewed_at INTEGER`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN updated_device TEXT`); } catch (e) { }
            try { await client.execute(`ALTER TABLE notes ADD COLUMN version INTEGER DEFAULT 1`); } catch (e) { }
            await client.execute(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
            
            // v1.2.0: Full-text search and performance optimization
            // Create FTS5 virtual table for SQLite
            await client.execute(`
                CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                    title, content, 
                    content='notes', 
                    content_rowid='rowid'
                )
            `);
            
            // Create triggers to keep FTS index in sync
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
                    INSERT INTO notes_fts(rowid, title, content) 
                    VALUES (new.rowid, new.title, new.content);
                END
            `);
            
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
                    INSERT INTO notes_fts(notes_fts, rowid, title, content) 
                    VALUES ('delete', old.rowid, old.title, old.content);
                END
            `);
            
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
                    INSERT INTO notes_fts(notes_fts, rowid, title, content) 
                    VALUES ('delete', old.rowid, old.title, old.content);
                    INSERT INTO notes_fts(rowid, title, content) 
                    VALUES (new.rowid, new.title, new.content);
                END
            `);
            
            // Performance indexes
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = 1`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_folder_path ON notes(folder_path)`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type)`);
            await client.execute(`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NULL`);
            
            // Initialize FTS index with existing notes (if FTS table is empty)
            try {
                const ftsCount = await client.execute(`SELECT COUNT(*) as count FROM notes_fts`);
                if (ftsCount.rows && ftsCount.rows[0].count === 0) {
                    console.log('[DB] Initializing FTS index with existing notes...');
                    await client.execute(`
                        INSERT INTO notes_fts(rowid, title, content)
                        SELECT rowid, title, content FROM notes WHERE deleted_at IS NULL
                    `);
                    console.log('[DB] FTS index initialized successfully');
                }
            } catch (e) {
                console.error('[DB] Failed to initialize FTS index:', e);
            }
            
            // v1.2.0: Daily writing statistics
            await client.execute(`
                CREATE TABLE IF NOT EXISTS daily_writing_stats (
                    date TEXT PRIMARY KEY,
                    note_count INTEGER DEFAULT 0,
                    total_words INTEGER DEFAULT 0,
                    total_read_time INTEGER DEFAULT 0,
                    edit_count INTEGER DEFAULT 0,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            
            // Trigger to update daily stats on note insert
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS update_daily_stats_insert 
                AFTER INSERT ON notes
                WHEN NEW.deleted_at IS NULL
                BEGIN
                    INSERT INTO daily_writing_stats(date, note_count, total_words, total_read_time, edit_count, created_at, updated_at)
                    VALUES(
                        date(NEW.created_at / 1000, 'unixepoch'),
                        1,
                        COALESCE(NEW.word_count, 0),
                        COALESCE(NEW.read_time_minutes, 0),
                        0,
                        NEW.created_at,
                        NEW.updated_at
                    )
                    ON CONFLICT(date) DO UPDATE SET
                        note_count = note_count + 1,
                        total_words = total_words + excluded.total_words,
                        total_read_time = total_read_time + excluded.total_read_time,
                        updated_at = excluded.updated_at;
                END
            `);
            
            // Trigger to update daily stats on note update
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS update_daily_stats_update 
                AFTER UPDATE ON notes
                WHEN NEW.deleted_at IS NULL AND OLD.deleted_at IS NULL
                BEGIN
                    UPDATE daily_writing_stats SET
                        total_words = total_words - COALESCE(OLD.word_count, 0) + COALESCE(NEW.word_count, 0),
                        total_read_time = total_read_time - COALESCE(OLD.read_time_minutes, 0) + COALESCE(NEW.read_time_minutes, 0),
                        edit_count = edit_count + 1,
                        updated_at = NEW.updated_at
                    WHERE date = date(NEW.updated_at / 1000, 'unixepoch');
                END
            `);
            
            // Trigger to update daily stats on note delete
            await client.execute(`
                CREATE TRIGGER IF NOT EXISTS update_daily_stats_delete 
                AFTER UPDATE ON notes
                WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
                BEGIN
                    UPDATE daily_writing_stats SET
                        note_count = note_count - 1,
                        total_words = total_words - COALESCE(OLD.word_count, 0),
                        total_read_time = total_read_time - COALESCE(OLD.read_time_minutes, 0),
                        updated_at = NEW.updated_at
                    WHERE date = date(OLD.updated_at / 1000, 'unixepoch');
                END
            `);
        } else {
            const postgresDb = db as PostgresJsDatabase<any>;
            await postgresDb.execute(drizzleSql`
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT 'Untitled Note',
                    content TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '[]',
                    share_token TEXT,
                    created_at BIGINT NOT NULL,
                    updated_at BIGINT NOT NULL,
                    is_pinned TEXT NOT NULL DEFAULT 'false',
                    deleted_at BIGINT
                )
            `);
            // Migrations for existing tables
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS share_token TEXT`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned TEXT NOT NULL DEFAULT 'false'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at BIGINT`); } catch (e) { }
            
            // v1.1.0: 22 one-line database enhancements
            // Data statistics
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS char_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0`); } catch (e) { }
            
            // Content analysis
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS code_blocks INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS link_count INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS content_hash TEXT`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS cover_image TEXT`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS first_paragraph TEXT`); } catch (e) { }
            
            // Metadata
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'article'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_path TEXT DEFAULT '/'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS metadata TEXT DEFAULT '{}'`); } catch (e) { }
            
            // Organization
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_starred TEXT DEFAULT 'false'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0`); } catch (e) { }
            
            // Audit
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS last_viewed_at BIGINT`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_device TEXT`); } catch (e) { }
            try { await postgresDb.execute(drizzleSql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`); } catch (e) { }
            await postgresDb.execute(drizzleSql`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
            
            // v1.2.0: Full-text search and performance optimization for PostgreSQL
            // Add tsvector column for full-text search
            try {
                await postgresDb.execute(drizzleSql`
                    ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector
                    GENERATED ALWAYS AS (
                        setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
                        setweight(to_tsvector('simple', COALESCE(content, '')), 'B')
                    ) STORED
                `);
            } catch (e) { }
            
            // Create GIN index for fast full-text search
            await postgresDb.execute(drizzleSql`
                CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(search_vector)
            `);
            
            // Performance indexes
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)`);
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = 'true'`);
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_folder_path ON notes(folder_path)`);
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)`);
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type)`);
            await postgresDb.execute(drizzleSql`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NULL`);
            
            // v1.2.0: Daily writing statistics for PostgreSQL
            await postgresDb.execute(drizzleSql`
                CREATE TABLE IF NOT EXISTS daily_writing_stats (
                    date TEXT PRIMARY KEY,
                    note_count INTEGER DEFAULT 0,
                    total_words INTEGER DEFAULT 0,
                    total_read_time INTEGER DEFAULT 0,
                    edit_count INTEGER DEFAULT 0,
                    created_at BIGINT NOT NULL,
                    updated_at BIGINT NOT NULL
                )
            `);
            
            // Function to update daily stats
            await postgresDb.execute(drizzleSql`
                CREATE OR REPLACE FUNCTION update_daily_stats()
                RETURNS TRIGGER AS $$
                DECLARE
                    note_date TEXT;
                BEGIN
                    note_date := TO_CHAR(TO_TIMESTAMP(NEW.created_at / 1000), 'YYYY-MM-DD');
                    
                    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
                        INSERT INTO daily_writing_stats(date, note_count, total_words, total_read_time, edit_count, created_at, updated_at)
                        VALUES(note_date, 1, COALESCE(NEW.word_count, 0), COALESCE(NEW.read_time_minutes, 0), 0, NEW.created_at, NEW.updated_at)
                        ON CONFLICT(date) DO UPDATE SET
                            note_count = daily_writing_stats.note_count + 1,
                            total_words = daily_writing_stats.total_words + EXCLUDED.total_words,
                            total_read_time = daily_writing_stats.total_read_time + EXCLUDED.total_read_time,
                            updated_at = EXCLUDED.updated_at;
                    ELSIF TG_OP = 'UPDATE' THEN
                        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                            -- Note moved to trash
                            UPDATE daily_writing_stats SET
                                note_count = note_count - 1,
                                total_words = total_words - COALESCE(OLD.word_count, 0),
                                total_read_time = total_read_time - COALESCE(OLD.read_time_minutes, 0),
                                updated_at = NEW.updated_at
                            WHERE date = TO_CHAR(TO_TIMESTAMP(OLD.updated_at / 1000), 'YYYY-MM-DD');
                        ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
                            -- Note updated
                            UPDATE daily_writing_stats SET
                                total_words = total_words - COALESCE(OLD.word_count, 0) + COALESCE(NEW.word_count, 0),
                                total_read_time = total_read_time - COALESCE(OLD.read_time_minutes, 0) + COALESCE(NEW.read_time_minutes, 0),
                                edit_count = edit_count + 1,
                                updated_at = NEW.updated_at
                            WHERE date = TO_CHAR(TO_TIMESTAMP(NEW.updated_at / 1000), 'YYYY-MM-DD');
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            `);
            
            // Create trigger
            await postgresDb.execute(drizzleSql`
                DROP TRIGGER IF EXISTS update_daily_stats_trigger ON notes;
                CREATE TRIGGER update_daily_stats_trigger
                AFTER INSERT OR UPDATE ON notes
                FOR EACH ROW
                EXECUTE FUNCTION update_daily_stats()
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
