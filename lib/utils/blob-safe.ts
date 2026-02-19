// Safe wrapper for Vercel Blob operations
// Only imports and uses @vercel/blob when BLOB_READ_WRITE_TOKEN is available

let blobModule: typeof import('@vercel/blob') | null = null;

function getBlobModule() {
    if (!blobModule && process.env.BLOB_READ_WRITE_TOKEN) {
        blobModule = require('@vercel/blob');
    }
    return blobModule;
}

export async function put(filename: string, body: string, options: any) {
    const blob = getBlobModule();
    if (!blob) throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    return blob.put(filename, body, options);
}

export async function list(options?: { prefix?: string }) {
    const blob = getBlobModule();
    if (!blob) return { blobs: [] };
    return blob.list(options);
}