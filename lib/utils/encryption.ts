import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const DEFAULT_KEY = 'easy-note-default-secret-key-32-chars!!'; // Fallback

function getEncryptionKey(): Buffer {
    const key = process.env.CONFIG_ENCRYPTION_KEY || DEFAULT_KEY;
    // Ensure 32 bytes for AES-256
    return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Return format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(hash: string): string {
    const [ivHex, tagHex, encryptedText] = hash.split(':');
    if (!ivHex || !tagHex || !encryptedText) {
        throw new Error('Invalid encryption format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
