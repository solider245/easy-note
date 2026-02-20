import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/encryption';
import { isVercel, canModifyConfig } from '../utils/environment';
import fs from 'fs';
import path from 'path';

const SENSITIVE_KEYS = [
    'OPENAI_API_KEY',
    'S3_SECRET_ACCESS_KEY',
    'DATABASE_AUTH_TOKEN',
    'ADMIN_PASSWORD',
    'TURSO_AUTH_TOKEN'
];

const CONFIG_FILE_PATH = process.env.LOCAL_CONFIG_PATH || path.join(process.cwd(), 'data', 'local-config.json');

export class ConfigService {
    private static instance: ConfigService;
    private cache: Map<string, string> = new Map();
    private fileConfig: Record<string, string> = {};

    private constructor() {
        this.loadFileConfig();
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

    private saveFileConfig() {
        // Only save to file on VPS/development
        if (isVercel()) {
            console.warn('Cannot save config to file on Vercel. Use environment variables instead.');
            return;
        }

        try {
            const dir = path.dirname(CONFIG_FILE_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.fileConfig, null, 2));
            console.log('Saved local-config.json');
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
     * Get a config value
     * 
     * Vercel: Env only (read-only)
     * VPS: File > Env > DB (File takes precedence for user overrides)
     * 
     * Exception: ADMIN_PASSWORD always uses DB > Env (for password changes)
     */
    async get(key: string): Promise<string | undefined> {
        // Check cache first
        if (this.cache.has(key)) return this.cache.get(key);

        // Special case: ADMIN_PASSWORD - DB takes priority for password changes
        if (key === 'ADMIN_PASSWORD') {
            const dbVal = await this.getFromDb(key);
            if (dbVal !== undefined) {
                this.cache.set(key, dbVal);
                return dbVal;
            }
            const envVal = process.env[key];
            if (envVal) {
                this.cache.set(key, envVal);
                return envVal;
            }
            return undefined;
        }

        // Vercel mode: Env only
        if (isVercel()) {
            const envVal = process.env[key];
            if (envVal) {
                this.cache.set(key, envVal);
                return envVal;
            }
            return undefined;
        }

        // VPS mode: File > Env > DB
        // File takes precedence so users can override env vars
        if (this.fileConfig[key]) {
            this.cache.set(key, this.fileConfig[key]);
            return this.fileConfig[key];
        }

        const envVal = process.env[key];
        if (envVal) {
            this.cache.set(key, envVal);
            return envVal;
        }

        const dbVal = await this.getFromDb(key);
        if (dbVal !== undefined) {
            this.cache.set(key, dbVal);
            return dbVal;
        }

        return undefined;
    }

    /**
     * Internal helper: fetch a value directly from DB
     */
    private async getFromDb(key: string): Promise<string | undefined> {
        try {
            const db = await getDb();
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
     * Save a config value
     * 
     * Vercel: Throws error (read-only)
     * VPS: Saves to file (persists across restarts)
     */
    async set(key: string, value: string): Promise<void> {
        // Cannot modify config on Vercel
        if (isVercel()) {
            throw new Error(
                'Configuration cannot be modified at runtime on Vercel. ' +
                'Please set environment variables in your Vercel project settings and redeploy.'
            );
        }

        // Database connection strings go to File for persistence
        if (key === 'DATABASE_URL' || key === 'TURSO_DATABASE_URL' || key === 'TURSO_AUTH_TOKEN') {
            this.fileConfig[key] = value;
            this.saveFileConfig();
            this.cache.set(key, value);
            return;
        }

        // Other configs go to DB if available
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
    }

    /**
     * Get database configuration
     * 
     * Vercel: Env only
     * VPS: File > Env (File takes precedence)
     */
    async getDatabaseConfig(): Promise<{ provider: 'turso' | 'supabase'; url: string; token?: string } | null> {
        if (isVercel()) {
            // Vercel: Only check environment variables
            const tursoUrl = process.env.TURSO_DATABASE_URL;
            const tursoToken = process.env.TURSO_AUTH_TOKEN;
            
            if (tursoUrl) {
                return { provider: 'turso', url: tursoUrl, token: tursoToken };
            }

            const pgUrl = process.env.DATABASE_URL;
            if (pgUrl) {
                return { provider: 'supabase', url: pgUrl };
            }

            return null;
        }

        // VPS: File takes precedence over Env
        if (this.fileConfig['TURSO_DATABASE_URL']) {
            return {
                provider: 'turso',
                url: this.fileConfig['TURSO_DATABASE_URL'],
                token: this.fileConfig['TURSO_AUTH_TOKEN']
            };
        }

        if (this.fileConfig['DATABASE_URL']) {
            return { provider: 'supabase', url: this.fileConfig['DATABASE_URL'] };
        }

        // Fall back to environment variables
        const tursoUrl = process.env.TURSO_DATABASE_URL;
        const tursoToken = process.env.TURSO_AUTH_TOKEN;
        
        if (tursoUrl) {
            return { provider: 'turso', url: tursoUrl, token: tursoToken };
        }

        const pgUrl = process.env.DATABASE_URL;
        if (pgUrl) {
            return { provider: 'supabase', url: pgUrl };
        }

        return null;
    }

    /**
     * Check if configuration can be modified
     */
    canModify(): boolean {
        return canModifyConfig();
    }
}

export const configService = ConfigService.getInstance();
