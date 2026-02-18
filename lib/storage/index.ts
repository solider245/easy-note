import type { StorageAdapter } from '../types';

let _instance: StorageAdapter | null = null;

export async function getStorage(): Promise<StorageAdapter> {
    if (_instance) return _instance;

    if (process.env.DATABASE_URL) {
        const { DbAdapter } = await import('./db-adapter');
        _instance = new DbAdapter();
    } else {
        const { BlobAdapter } = await import('./blob-adapter');
        _instance = new BlobAdapter();
    }

    return _instance!;
}
