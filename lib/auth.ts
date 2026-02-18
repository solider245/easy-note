import { configService } from './config/config-service';
import crypto from 'crypto';

export const DEFAULT_PASSWORD = 'admin123';

// Secret for signing auth tokens (falls back to a default for dev)
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.CONFIG_ENCRYPTION_KEY || 'easy-note-auth-secret-change-me';

export function isUsingDefaultPassword(): boolean {
    return !process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string): boolean {
    const correct = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    return input === correct;
}

// Called at runtime (server-side) to check password, including DB-stored override
export async function checkPasswordWithDb(input: string): Promise<boolean> {
    const storedPassword = await configService.get('ADMIN_PASSWORD');
    if (storedPassword) {
        return input === storedPassword;
    }
    return checkPassword(input);
}

// Generate a signed auth token
export function generateAuthToken(): string {
    const payload = `authenticated:${Date.now()}`;
    const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    return `${payload}:${sig}`;
}

// Verify a signed auth token
export function verifyAuthToken(token: string): boolean {
    try {
        const parts = token.split(':');
        if (parts.length < 3) return false;
        const sig = parts.pop()!;
        const payload = parts.join(':');
        const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
        return false;
    }
}
