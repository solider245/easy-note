import type { MediaAdapter } from '../types';

let _mediaInstance: MediaAdapter | null = null;

export async function getMediaStorage(): Promise<MediaAdapter> {
    if (_mediaInstance) return _mediaInstance;

    // 优先使用 S3 兼容存储
    if (process.env.S3_ENDPOINT || process.env.AWS_S3_BUCKET) {
        const { S3MediaAdapter } = await import('./s3-media-adapter');
        _mediaInstance = new S3MediaAdapter();
    } else {
        // 回退到 Vercel Blob
        const { BlobMediaAdapter } = await import('./blob-media-adapter');
        _mediaInstance = new BlobMediaAdapter();
    }

    return _mediaInstance!;
}
