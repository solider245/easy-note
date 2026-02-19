import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/encryption';
import fs from 'fs';
import path from 'path';
import { put, head, list } from '@vercel/blob';

const SENSITIVE_KEYS = [
    'OPENAI_API_KEY',
    'S3_SECRET_ACCESS_KEY',
    'DATABASE_AUTH_TOKEN',
    'ADMIN_PASSWORD',
    'TURSO_AUTH_TOKEN'
];

// Database connection related keys that should be stored in file/blob
const DB_CONFIG_KEYS = ['DATABASE_URL', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'DATABASE_CONFIG'];

const CONFIG_FILE_PATH = process.env.LOCAL_CONFIG_PATH || path.join(process.cwd(), 'data', 'local-config.json');

// Vercel Blob configuration filename
const BLOB_CONFIG_KEY = 'database-config.json';

export class ConfigService {
    private static instance: ConfigService;
    private cache: Map<string, string> = new Map();
    private fileConfig: Record<string, string> = {};
    private blobConfig: Record<string, string> | null = null;

    private constructor() {
        this.loadFileConfig();
    }

    /**
     * Check if running in Vercel environment
     */
    private isVercel(): boolean {
        return !!process.env.VERCEL || !!process.env.VERCEL_ENV;
    }

    private loadFileConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE_PATH)) {
                const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
                this.fileConfig = JSON.parse(data);
                console.log('Loaded local-config.json');
            }
        } catch (e) {
            console.error('Failed to load local-config.json:', e);
        }
    }

    /**
     * Load configuration from Vercel Blob (for Vercel deployments)
     */
    private async loadBlobConfig(): Promise<Record<string, string>> {
        if (this.blobConfig !== null) {
            return this.blobConfig;
        }

        try {
            // Try to list blobs with the config key
            const blobs = await list({ prefix: BLOB_CONFIG_KEY });
            const configBlob = blobs.blobs.find(b => b.pathname === BLOB_CONFIG_KEY);
            
            if (configBlob) {
                // Fetch the blob content
                const response = await fetch(configBlob.url);
                if (response.ok) {
                    const data = await response.json() as Record<string, string>;
                    this.blobConfig = data;
                    console.log('Loaded config from Vercel Blob');
                    return this.blobConfig;
                }
            }
        } catch (e) {
            console.log('No config found in Vercel Blob');
        }

        this.blobConfig = {};
        return this.blobConfig;
    }

    /**
     * Save configuration to Vercel Blob (for Vercel deployments)
     */
    private async saveBlobConfig(config: Record<string, string>): Promise<void> {
        try {
            const jsonString = JSON.stringify(config, null, 2);
            await put(BLOB_CONFIG_KEY, jsonString, {
                access: 'public',
                addRandomSuffix: false,
            });
            this.blobConfig = config;
            console.log('Saved config to Vercel Blob');
        } catch (e) {
            console.error('Failed to save config to Vercel Blob:', e);
            throw e;
        }
    }

    private saveFileConfig() {
        try {
            const dir = path.dirname(CONFIG_FILE_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.fileConfig, null, 2));
        } catch (e) {
            console.error('Failed to save local-config.json:', e);
        }
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Get a config value.
     * For ADMIN_PASSWORD: DB > Env (user can override via UI)
     * For others: Env > File > DB
     */
    async get(key: string): Promise<string | undefined> {
        // 1. Check cache
        if (this.cache.has(key)) return this.cache.get(key);

        // Special case: ADMIN_PASSWORD — DB takes priority over env so UI changes take effect
        if (key === 'ADMIN_PASSWORD') {
            const dbVal = await this.getFromDb(key);
            if (dbVal !== undefined) {
                this.cache.set(key, dbVal);
                return dbVal;
            }
            // Fall back to env variable (default password)
            const envVal = process.env[key];
            if (envVal) {
                this.cache.set(key, envVal);
                return envVal;
            }
            return undefined;
        }

        // 2. Check Env
        const envVal = process.env[key];
        if (envVal) {
            this.cache.set(key, envVal);
            return envVal;
        }

        // 3. Check File (VPS/Docker persistence)
        if (this.fileConfig[key]) {
            this.cache.set(key, this.fileConfig[key]);
            return this.fileConfig[key];
        }

        // 4. Check Vercel Blob (for Vercel deployments, only for DB config keys)
        if (this.isVercel() && DB_CONFIG_KEYS.includes(key)) {
            try {
                const blobConfig = await this.loadBlobConfig();
                if (blobConfig[key]) {
                    this.cache.set(key, blobConfig[key]);
                    return blobConfig[key];
                }
            } catch (e) {
                console.error('Failed to load from Vercel Blob:', e);
            }
        }

        // 5. Check DB
        const dbVal = await this.getFromDb(key);
        if (dbVal !== undefined) {
            this.cache.set(key, dbVal);
            return dbVal;
        }

        return undefined;
    }

    /**
     * Internal helper: fetch a value directly from DB (no cache, no env).
     */
    private async getFromDb(key: string): Promise<string | undefined> {
        try {
            const db = await getDb();
            // We need to avoid infinite recursion here.
            // getDb calls configService.get in some flows, but only for secondary keys usually.
            // The primary DATABASE_URL must be from Env or File.

            const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || this.fileConfig['DATABASE_URL'] || this.fileConfig['TURSO_DATABASE_URL'];
            if (!dbUrl) return undefined;

            const isSQLite = dbUrl.startsWith('libsql://') || dbUrl.startsWith('file:');
            const { settings } = isSQLite
                ? await import('../db/schema')
                : await import('../db/schema.pg');

            const rows = await (db as any).select().from(settings).where(eq(settings.key, key)).limit(1);

            if (rows.length > 0) {
                let val = rows[0].value;
                if (SENSITIVE_KEYS.includes(key)) {
                    val = decrypt(val);
                }
                return val;
            }
        } catch (e) {
            // Ignore DB errors (e.g. during initial setup)
        }
        return undefined;
    }

    /**
     * Save a config value. 
     * DATABASE_URL and TURSO_AUTH_TOKEN go to File.
     * Others go to DB if possible.
     */
    async set(key: string, value: string): Promise<void> {
        // Special case: Database connection strings
        if (DB_CONFIG_KEYS.includes(key)) {
            // In Vercel environment, save to Blob
            if (this.isVercel()) {
                try {
                    const blobConfig = await this.loadBlobConfig();
                    blobConfig[key] = value;
                    await this.saveBlobConfig(blobConfig);
                    this.cache.set(key, value);
                    return;
                } catch (e) {
                    console.error('Failed to save to Vercel Blob, falling back to file:', e);
                }
            }
            
            // Save to Local File for VPS/Docker persistence
            this.fileConfig[key] = value;
            this.saveFileConfig();
            this.cache.set(key, value);
            return;
        }

        const db = await getDb();
        const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || this.fileConfig['DATABASE_URL'] || this.fileConfig['TURSO_DATABASE_URL'];

        if (!dbUrl) throw new Error('Database connection required to save settings');

        const isSQLite = dbUrl.startsWith('libsql://') || dbUrl.startsWith('file:');
        const { settings } = isSQLite
            ? await import('../db/schema')
            : await import('../db/schema.pg');

        let valToSave = value;
        if (SENSITIVE_KEYS.includes(key)) {
            valToSave = encrypt(value);
        }

        try {
            await (db as any).insert(settings)
                .values({ key, value: valToSave })
                .onConflictDoUpdate({
                    target: settings.key,
                    set: { value: valToSave }
                });
        } catch (e) {
            await (db as any).delete(settings).where(eq(settings.key, key));
            await (db as any).insert(settings).values({ key, value: valToSave });
        }

        this.cache.set(key, value);
    }

    clearCache() {
        this.cache.clear();
        this.blobConfig = null; // Also clear blob config cache
    }

    /**
     * Get complete database configuration object
     * Returns parsed DATABASE_CONFIG or constructs from legacy keys
     */
    async getDatabaseConfig(): Promise<{ provider: 'turso' | 'supabase'; url: string; token?: string } | null> {
        // First try to get DATABASE_CONFIG (new format)
        const configStr = await this.get('DATABASE_CONFIG');
        if (configStr) {
            try {
                return JSON.parse(configStr);
            } catch (e) {
                console.error('Failed to parse DATABASE_CONFIG:', e);
            }
        }

        // Fallback to legacy keys for backward compatibility
        const tursoUrl = await this.get('TURSO_DATABASE_URL');
        const tursoToken = await this.get('TURSO_AUTH_TOKEN');
        
        if (tursoUrl) {
            return {
                provider: 'turso',
                url: tursoUrl,
                token: tursoToken
            };
        }

        const pgUrl = await this.get('DATABASE_URL');
        if (pgUrl) {
            return {
                provider: 'supabase',
                url: pgUrl
            };
        }

        return null;
    }

    /**
     * Save complete database configuration
     */
    async saveDatabaseConfig(config: { provider: 'turso' | 'supabase'; url: string; token?: string }): Promise<void> {
        // Save as JSON string
        await this.set('DATABASE_CONFIG', JSON.stringify(config));
        
        // Also save individual keys for backward compatibility with existing code
        if (config.provider === 'turso') {
            await this.set('TURSO_DATABASE_URL', config.url);
            if (config.token) {
                await this.set('TURSO_AUTH_TOKEN', config.token);
            }
        } else {
            await this.set('DATABASE_URL', config.url);
        }
    }

    /**
     * Clear all database configuration
     */
    async clearDatabaseConfig(): Promise<void> {
        // Clear blob config
        if (this.isVercel()) {
            try {
                await this.saveBlobConfig({});
            } catch (e) {
                console.error('Failed to clear Vercel Blob config:', e);
            }
        }

        // Clear file config
        this.fileConfig = {};
        try {
            if (fs.existsSync(CONFIG_FILE_PATH)) {
                fs.unlinkSync(CONFIG_FILE_PATH);
            }
        } catch (e) {
            console.error('Failed to clear file config:', e);
        }

        // Clear cache
        DB_CONFIG_KEYS.forEach(key => this.cache.delete(key));
        this.blobConfig = null;
    }
}

export const configService = ConfigService.getInstance();
