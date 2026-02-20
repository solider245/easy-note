import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';
import { configService } from '@/lib/config/config-service';
import { reloadStorage, getStorageType } from '@/lib/storage';
import { isVercel } from '@/lib/utils/environment';

/**
 * Test and save database connection
 * 
 * Vercel: Test only (returns connection status)
 * VPS: Test, save to file, and hot reload
 */
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

        // Test the connection first
        const testResult = await testDatabaseConnection(url, token);
        if (!testResult.success) {
            return NextResponse.json(testResult, { status: 400 });
        }

        // On Vercel: Only test, don't save
        if (isVercel()) {
            return NextResponse.json({
                success: true,
                message: 'Connection test successful. On Vercel, please set environment variables and redeploy.',
                envVars: body.provider === 'turso' 
                    ? `TURSO_DATABASE_URL=${url}\nTURSO_AUTH_TOKEN=${token || ''}`
                    : `DATABASE_URL=${url}`,
                vercelMode: true,
                latency: testResult.latency
            });
        }

        // On VPS: Save configuration and reload
        try {
            // Save to config
            if (body.provider === 'turso') {
                await configService.set('TURSO_DATABASE_URL', url);
                if (token) {
                    await configService.set('TURSO_AUTH_TOKEN', token);
                }
            } else {
                await configService.set('DATABASE_URL', url);
            }

            // Hot reload storage (VPS only)
            await reloadStorage();

            const storageType = await getStorageType();

            return NextResponse.json({
                success: true,
                message: `Connected to ${body.provider === 'turso' ? 'Turso' : 'Supabase'} successfully`,
                storageType,
                latency: testResult.latency,
                hotReloaded: true
            });
        } catch (saveError) {
            return NextResponse.json({
                success: false,
                message: 'Connection test passed but failed to save configuration: ' + (saveError instanceof Error ? saveError.message : 'Unknown error'),
                testPassed: true,
                saveError: true
            }, { status: 500 });
        }
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