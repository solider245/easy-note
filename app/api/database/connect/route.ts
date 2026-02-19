import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';
import { configService } from '@/lib/config/config-service';
import { reloadStorage, getStorageType } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.provider) {
            return NextResponse.json(
                { success: false, message: 'Provider is required' },
                { status: 400 }
            );
        }

        let url: string;
        let token: string | undefined;

        // Parse configuration based on provider
        if (body.provider === 'turso') {
            if (!body.url) {
                return NextResponse.json(
                    { success: false, message: 'Database URL is required for Turso' },
                    { status: 400 }
                );
            }
            url = body.url;
            token = body.token;
        } else if (body.provider === 'supabase') {
            if (body.connectionString) {
                url = body.connectionString;
            } else if (body.host && body.database && body.username) {
                const port = body.port || 5432;
                const ssl = body.ssl !== false ? '?sslmode=require' : '';
                url = `postgresql://${body.username}:${body.password || ''}@${body.host}:${port}/${body.database}${ssl}`;
            } else {
                return NextResponse.json(
                    { success: false, message: 'Connection string or manual settings are required for Supabase' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid provider' },
                { status: 400 }
            );
        }

        // First, test the connection
        const testResult = await testDatabaseConnection(url, token);
        if (!testResult.success) {
            return NextResponse.json(testResult, { status: 400 });
        }

        // Save configuration
        await configService.saveDatabaseConfig({
            provider: body.provider,
            url,
            token
        });

        // Reload storage to use the new database
        const storage = await reloadStorage();

        // Get new storage type
        const storageType = await getStorageType();

        return NextResponse.json({
            success: true,
            message: `Connected to ${body.provider === 'turso' ? 'Turso' : 'Supabase'} successfully`,
            storageType,
            latency: testResult.latency
        });
    } catch (error) {
        console.error('Database connect error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : 'Failed to connect database' 
            },
            { status: 500 }
        );
    }
}