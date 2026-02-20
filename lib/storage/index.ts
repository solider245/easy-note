import type { StorageAdapter } from '../types';
import { supportsHotReload } from '../utils/environment';

let _instance: StorageAdapter | null = null;
let _storageType: 'database' | 'blob' | 'memory' | null = null;

/**
 * Initialize storage at startup
 * Determines storage type based on environment variables and file config
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
                    'Please configure a database (Turso or Supabase). ' +
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
 * Get storage type based on configuration
 * Priority: Database > Blob > Memory (development only)
 * 
 * On VPS: File config takes precedence over env vars
 * On Vercel: Env vars only
 */
export async function getStorageType(): Promise<'database' | 'blob' | 'memory'> {
    if (_storageType) return _storageType;

    const { configService } = await import('../config/config-service');
    const dbConfig = await configService.getDatabaseConfig();

    // Priority 1: Database (Turso or PostgreSQL)
    if (dbConfig) {
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
 * Reload storage adapter
 * Used after changing database configuration on VPS
 * 
 * Note: Not available on Vercel (requires redeploy)
 */
export async function reloadStorage(): Promise<StorageAdapter> {
    if (!supportsHotReload()) {
        throw new Error(
            'Hot reload is not available on Vercel. ' +
            'Please update environment variables in Vercel Dashboard and redeploy.'
        );
    }

    // Clear cached instance
    _instance = null;
    _storageType = null;

    // Clear config cache
    const { configService } = await import('../config/config-service');
    configService.clearCache();

    console.log('Storage reloaded with new configuration');
    
    // Force re-initialization
    return getStorage();
}

/**
 * Check if storage is properly configured
 */
export async function isStorageConfigured(): Promise<boolean> {
    const storageType = await getStorageType();
    return storageType === 'database' || storageType === 'blob';
}
