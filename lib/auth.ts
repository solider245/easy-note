export const DEFAULT_PASSWORD = 'admin123';

export function isUsingDefaultPassword(): boolean {
    return !process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string): boolean {
    const correct = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    return input === correct;
}

// Called at runtime (server-side) to check password, including DB-stored override
export async function checkPasswordWithDb(input: string): Promise<boolean> {
    // If a database is connected, check for a stored password override
    if (process.env.DATABASE_URL) {
        try {
            const { getDb } = await import('./db');
            const db = await getDb();
            const url = process.env.DATABASE_URL;
            const isSQLite = url.startsWith('libsql://') || url.startsWith('file:');
            const { settings } = isSQLite
                ? await import('./db/schema')
                : await import('./db/schema.pg');
            const { eq } = await import('drizzle-orm');

            const rows = await (db as any).select().from(settings).where(eq(settings.key, 'admin_password')).limit(1);
            if (rows.length > 0) {
                return input === rows[0].value;
            }
        } catch {
            // Fall through to env var check
        }
    }
    return checkPassword(input);
}
