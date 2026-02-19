import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';

/**
 * Test database connection (read-only)
 * Used in settings page to verify user-provided credentials
 * Note: Actual database configuration must be set via environment variables
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

        // Test the connection
        const testResult = await testDatabaseConnection(url, token);

        return NextResponse.json(testResult);
    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : 'Failed to test connection' 
            },
            { status: 500 }
        );
    }
}