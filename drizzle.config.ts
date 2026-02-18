import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL!;
const isSQLite = url?.startsWith('libsql://') || url?.startsWith('file:');

export default defineConfig({
    schema: isSQLite ? './lib/db/schema.ts' : './lib/db/schema.pg.ts',
    out: './drizzle',
    dialect: isSQLite ? 'turso' : 'postgresql',
    dbCredentials: isSQLite
        ? {
            url,
            authToken: process.env.DATABASE_AUTH_TOKEN,
        }
        : {
            url,
        },
});
