import { configService } from './config/config-service';

export const AUTH_COOKIE_VALUE = 'authenticated';

// Generate a secure random password if none is set
function generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Returns true if password protection is enabled.
 * Password protection is only active when ADMIN_PASSWORD is explicitly set
 * (either via env var or saved in DB).
 */
export async function isPasswordProtected(): Promise<boolean> {
    const stored = await configService.get('ADMIN_PASSWORD');
    return !!stored || !!process.env.ADMIN_PASSWORD;
}

/**
 * Get the current password or initialize one.
 * If no password is set, generates a secure random password and saves it.
 */
export async function getOrInitializePassword(): Promise<string> {
    // First check environment variable
    if (process.env.ADMIN_PASSWORD) {
        return process.env.ADMIN_PASSWORD;
    }
    
    // Then check database
    const storedPassword = await configService.get('ADMIN_PASSWORD');
    if (storedPassword) {
        return storedPassword;
    }
    
    // Generate and save a secure random password
    const newPassword = generateSecurePassword();
    await configService.set('ADMIN_PASSWORD', newPassword);
    
    // Log the generated password (only once at initialization)
    console.log('[Security] Generated secure password:', newPassword);
    console.log('[Security] Please change this password in settings immediately!');
    
    return newPassword;
}

export async function checkPassword(input: string): Promise<boolean> {
    const correct = await getOrInitializePassword();
    return input === correct;
}

// Called at runtime (server-side) to check password, including DB-stored override
export async function checkPasswordWithDb(input: string): Promise<boolean> {
    const correct = await getOrInitializePassword();
    return input === correct;
}

/**
 * Check if the current password is the auto-generated one.
 * Used to show security warnings.
 */
export async function isUsingGeneratedPassword(): Promise<boolean> {
    // If env var is set, not using generated password
    if (process.env.ADMIN_PASSWORD) {
        return false;
    }
    
    // Check if we have a stored password (means it was auto-generated)
    const stored = await configService.get('ADMIN_PASSWORD');
    return !!stored;
}
