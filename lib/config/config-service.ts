import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../utils/encryption';
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

        // 4. Check DB
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
        // Special case: Database connection strings go to Local File for VPS persistence
        if (key === 'DATABASE_URL' || key === 'TURSO_DATABASE_URL' || key === 'TURSO_AUTH_TOKEN') {
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
    }
}

export const configService = ConfigService.getInstance();
