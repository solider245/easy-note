import type { MediaAdapter } from '../types';

/**
 * Stage 2 S3 Media Adapter Placeholder.
 * Implement with AWS SDK for S3, R2, etc.
 */
export class S3MediaAdapter implements MediaAdapter {
    async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
        throw new Error('S3 media adapter not implemented yet. Please add implementation to lib/media/s3-media-adapter.ts');
    }
    async del(url: string): Promise<void> {
        throw new Error('S3 media adapter not implemented yet.');
    }
}
