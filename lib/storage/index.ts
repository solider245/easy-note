import type { StorageAdapter } from '../types';

let _instance: StorageAdapter | null = null;
let _storageType: 'database' | 'blob' | 'memory' | null = null;

/**
 * Initialize storage at startup
 * Determines storage type based on environment variables only
 * No runtime switching supported - configuration is read-only
 */
export async function getStorage(): Promise<StorageAdapter> {
    if (_instance) return _instance;

    const storageType = await getStorageType();

    switch (storageType) {
        case 'database':
            const { DbAdapter } = await import('./db-adapter');
            _instance = new DbAdapter();
            break;
        
        case 'blob':
            const { BlobAdapter } = await import('./blob-adapter');
            _instance = new BlobAdapter();
            break;
        
        case 'memory':
        default:
            // Memory mode only available in development
            if (process.env.NODE_ENV === 'production') {
                throw new Error(
                    'Memory storage is not available in production. ' +
                    'Please configure a database (Turso or Supabase) or Vercel Blob. ' +
                    'See docs/DEPLOYMENT.md for setup instructions.'
                );
            }
            const { MemoryAdapter } = await import('./memory-adapter');
            _instance = new MemoryAdapter();
            break;
    }

    return _instance;
}

/**
 * Get storage type based on environment variables
 * Priority: Database > Blob > Memory (development only)
 */
export async function getStorageType(): Promise<'database' | 'blob' | 'memory'> {
    if (_storageType) return _storageType;

    // Priority 1: Database (Turso or PostgreSQL)
    if (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL) {
        _storageType = 'database';
        return 'database';
    }

    // Priority 2: Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        _storageType = 'blob';
        return 'blob';
    }

    // Priority 3: Memory (development only)
    _storageType = 'memory';
    return 'memory';
}

/**
 * Check if storage is properly configured
 * Returns true if database or blob is configured
 */
export function isStorageConfigured(): boolean {
    return !!(
        process.env.TURSO_DATABASE_URL ||
        process.env.DATABASE_URL ||
        process.env.BLOB_READ_WRITE_TOKEN
    );
}
