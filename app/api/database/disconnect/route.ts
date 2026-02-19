import { NextRequest, NextResponse } from 'next/server';
import { configService } from '@/lib/config/config-service';
import { reloadStorage, getStorageType } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Optional: confirm disconnect
        if (body.confirm !== true) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Please confirm disconnect by sending { confirm: true }',
                    warning: 'Disconnecting will revert to demo mode. Any unsaved data in the current database will be lost.'
                },
                { status: 400 }
            );
        }

        // Clear database configuration
        await configService.clearDatabaseConfig();

        // Reload storage (will fall back to memory)
        await reloadStorage();

        // Get new storage type
        const storageType = await getStorageType();

        return NextResponse.json({
            success: true,
            message: 'Disconnected from database. Now running in demo mode.',
            storageType,
            isDemoMode: storageType === 'memory',
        });
    } catch (error) {
        console.error('Database disconnect error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : 'Failed to disconnect database' 
            },
            { status: 500 }
        );
    }
}