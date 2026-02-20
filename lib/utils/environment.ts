/**
 * Environment detection utilities
 * Helps distinguish between Vercel, VPS, and development environments
 */

/**
 * Check if running on Vercel platform
 */
export function isVercel(): boolean {
    return !!process.env.VERCEL || !!process.env.VERCEL_ENV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

/**
 * Get deployment type
 * @returns 'vercel' | 'vps' | 'development'
 */
export function getDeploymentType(): 'vercel' | 'vps' | 'development' {
    if (isVercel()) return 'vercel';
    if (isProduction()) return 'vps';
    return 'development';
}

/**
 * Check if configuration can be modified at runtime
 * Only VPS and development allow runtime configuration changes
 */
export function canModifyConfig(): boolean {
    return !isVercel();
}

/**
 * Check if hot reload is supported
 * Only VPS supports reloading storage without restart
 */
export function supportsHotReload(): boolean {
    return !isVercel();
}
