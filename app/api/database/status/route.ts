import { NextResponse } from 'next/server';
import { configService } from '@/lib/config/config-service';
import { getStorageType } from '@/lib/storage';

export async function GET() {
    try {
        const storageType = await getStorageType();
        const dbConfig = await configService.getDatabaseConfig();

        // Determine provider from config
        let provider: 'turso' | 'supabase' | null = null;
        let url: string | null = null;

        if (dbConfig) {
            provider = dbConfig.provider;
            url = dbConfig.url;
        } else {
            // Check legacy env vars
            const tursoUrl = process.env.TURSO_DATABASE_URL;
            const pgUrl = process.env.DATABASE_URL;
            
            if (tursoUrl) {
                provider = 'turso';
                url = tursoUrl;
            } else if (pgUrl) {
                provider = 'supabase';
                url = pgUrl;
            }
        }

        // Mask sensitive parts of the URL
        let displayUrl: string | null = null;
        if (url) {
            try {
                const urlObj = new URL(url);
                // Show only the host part
                displayUrl = `${urlObj.protocol}//***@${urlObj.host}${urlObj.pathname}`;
            } catch {
                displayUrl = '***';
            }
        }

        return NextResponse.json({
            storageType,
            provider,
            url: displayUrl,
            isConfigured: storageType === 'database',
            isDemoMode: storageType === 'memory',
        });
    } catch (error) {
        console.error('Database status error:', error);
        return NextResponse.json(
            { 
                storageType: 'memory',
                provider: null,
                url: null,
                isConfigured: false,
                isDemoMode: true,
                error: error instanceof Error ? error.message : 'Failed to get status'
            },
            { status: 500 }
        );
    }
}