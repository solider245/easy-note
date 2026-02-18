import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { MediaAdapter } from '../types';

export class S3MediaAdapter implements MediaAdapter {
    private client: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor() {
        const endpoint = process.env.S3_ENDPOINT;
        const region = process.env.AWS_REGION || 'auto';

        this.client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            // Force path style for some S3 compatible providers if needed, 
            // but standard is virtual host style. R2 works with both.
            forcePathStyle: !!process.env.S3_FORCE_PATH_STYLE,
        });

        this.bucket = process.env.AWS_S3_BUCKET!;
        this.publicUrl = process.env.S3_PUBLIC_URL || '';
    }

    async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
        const key = `uploads/${filename}`;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: mimeType,
                // Access control depends on bucket policy usually, 
                // but some S3 providers need 'public-read'
                ACL: process.env.S3_ACL as any || undefined,
            })
        );

        // If S3_PUBLIC_URL is provided, use it. Otherwise, construct standard URL.
        if (this.publicUrl) {
            return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
        }

        // Standard S3/R2 URL pattern (might vary by provider)
        // For R2, it's usually https://<pub-hash>.r2.dev/key or custom domain
        return `https://${this.bucket}.${this.client.config.endpoint?.toString().replace('https://', '')}/${key}`;
    }

    async del(url: string): Promise<void> {
        // Extract key from URL
        let key = '';
        if (this.publicUrl && url.startsWith(this.publicUrl)) {
            key = url.replace(this.publicUrl, '').replace(/^\//, '');
        } else {
            // Fallback: try to extract after bucket name or last slash
            const parts = url.split('/');
            key = parts.slice(3).join('/'); // Skip https://bucket.endpoint/
        }

        if (!key) return;

        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );
    }

    async getUsage(): Promise<{ used: number; total: number }> {
        // S3 doesn't easily provide real-time usage via API (requires inventory)
        return { used: 0, total: Infinity };
    }
}
