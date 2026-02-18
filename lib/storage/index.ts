import type { StorageAdapter } from '../types';

let _instance: StorageAdapter | null = null;

export async function getStorage(): Promise<StorageAdapter> {
    if (_instance) return _instance;

    const hasDb = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;

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
