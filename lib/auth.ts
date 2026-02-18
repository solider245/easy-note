import { configService } from './config/config-service';

export const DEFAULT_PASSWORD = 'admin123';

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
