import type { StorageAdapter } from '../types';

let _instance: StorageAdapter | null = null;

export async function getStorage(): Promise<StorageAdapter> {
    if (_instance) return _instance;

    // Check config service first (for runtime database switching)
    const { configService } = await import('../config/config-service');
    const dbConfig = await configService.getDatabaseConfig();
    
    // Also check legacy env vars for backward compatibility
    const hasDb = dbConfig || process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;

    if (hasDb) {
        const { DbAdapter } = await import('./db-adapter');
        _instance = new DbAdapter();
        return _instance;
    }

    // Check for Vercel Blob token (env var only, no DB lookup needed here)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
        const { BlobAdapter } = await import('./blob-adapter');
        _instance = new BlobAdapter();
        return _instance;
    }

    // Fall back to in-memory storage (demo mode)
    const { MemoryAdapter } = await import('./memory-adapter');
    _instance = new MemoryAdapter();
    return _instance;
}

/**
 * Reload storage adapter
 * Used after switching database configuration at runtime
 */
export async function reloadStorage(): Promise<StorageAdapter> {
    // Clear cached instance
    _instance = null;
    
    // Force re-initialization
    return getStorage();
}

/**
 * Get current storage type without initializing
 * Useful for checking storage status
 */
export async function getStorageType(): Promise<'database' | 'blob' | 'memory'> {
    // Check config service first
    const { configService } = await import('../config/config-service');
    const dbConfig = await configService.getDatabaseConfig();
    
    if (dbConfig || process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL) {
        return 'database';
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
        return 'blob';
    }

    return 'memory';
}