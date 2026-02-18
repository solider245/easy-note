import type { StorageAdapter } from '../types';

let _instance: StorageAdapter | null = null;

export async function getStorage(): Promise<StorageAdapter> {
    if (_instance) return _instance;

    const { configService } = await import('../config/config-service');
    const hasDb = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;

    if (hasDb) {
        const { DbAdapter } = await import('./db-adapter');
        _instance = new DbAdapter();
    } else {
        const blobToken = await configService.get('BLOB_READ_WRITE_TOKEN');
        if (blobToken) {
            const { BlobAdapter } = await import('./blob-adapter');
            _instance = new BlobAdapter();
        } else {
            const { MemoryAdapter } = await import('./memory-adapter');
            _instance = new MemoryAdapter();
        }
    }

    return _instance!;
}
