export const DEFAULT_PASSWORD = 'admin123';

export function isUsingDefaultPassword(): boolean {
    return !process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string): boolean {
    const correct = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    return input === correct;
}
