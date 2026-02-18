import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/encryption';

const SENSITIVE_KEYS = [
    'OPENAI_API_KEY',
    'S3_SECRET_ACCESS_KEY',
    'DATABASE_AUTH_TOKEN',
    'ADMIN_PASSWORD'
];

export class ConfigService {
    private static instance: ConfigService;
    private cache: Map<string, string> = new Map();

    private constructor() { }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Get a config value. Priority: DB > Env
     */
    async get(key: string): Promise<string | undefined> {
        // 1. Check cache
        if (this.cache.has(key)) return this.cache.get(key);

        // 2. Check DB
        try {
            const db = await getDb();
            const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
            if (!url) throw new Error('No DB');

            const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
            const { settings } = isSQLite
                ? await import('../db/schema')
                : await import('../db/schema.pg');

            const rows = await (db as any).select().from(settings).where(eq(settings.key, key)).limit(1);

            if (rows.length > 0) {
                let val = rows[0].value;
                if (SENSITIVE_KEYS.includes(key)) {
                    val = decrypt(val);
                }
                this.cache.set(key, val);
                return val;
            }
        } catch (e) {
            // Log/Ignore DB errors during config fetch (e.g. initial setup)
        }

        // 3. Check Env
        const envVal = process.env[key];
        if (envVal) {
            this.cache.set(key, envVal);
            return envVal;
        }

        return undefined;
    }

    /**
     * Save a config value to DB
     */
    async set(key: string, value: string): Promise<void> {
        const db = await getDb();
        const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
        if (!url) throw new Error('Database connection required to save settings');

        const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
        const { settings } = isSQLite
            ? await import('../db/schema')
            : await import('../db/schema.pg');

        let valToSave = value;
        if (SENSITIVE_KEYS.includes(key)) {
            valToSave = encrypt(value);
        }

        // Upsert logic
        try {
            await (db as any).insert(settings)
                .values({ key, value: valToSave })
                .onConflictDoUpdate({
                    target: settings.key,
                    set: { value: valToSave }
                });
        } catch (e) {
            // PostgreSQL might need different onConflict logic or we just try delete/insert
            await (db as any).delete(settings).where(eq(settings.key, key));
            await (db as any).insert(settings).values({ key, value: valToSave });
        }

        // Update cache
        this.cache.set(key, value);
    }

    /**
     * Clear cache (useful for testing or after major updates)
     */
    clearCache() {
        this.cache.clear();
    }
}

export const configService = ConfigService.getInstance();
