/**
 * Simple in-memory rate limiter for API endpoints
 * For production, consider using Redis or database-backed rate limiting
 */

type RateLimitEntry = {
    count: number;
    resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
    maxRequests: number;      // Maximum requests allowed
    windowMs: number;         // Time window in milliseconds
}

export function rateLimit(
    identifier: string,
    options: RateLimitOptions = { maxRequests: 5, windowMs: 15 * 60 * 1000 } // 5 requests per 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    const entry = rateLimitStore.get(key);
    
    // Clean up expired entries
    if (entry && now > entry.resetTime) {
        rateLimitStore.delete(key);
    }
    
    // Get or create entry
    const currentEntry = rateLimitStore.get(key);
    
    if (!currentEntry) {
        // First request
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + options.windowMs,
        });
        return {
            allowed: true,
            remaining: options.maxRequests - 1,
            resetTime: now + options.windowMs,
        };
    }
    
    // Check if limit exceeded
    if (currentEntry.count >= options.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: currentEntry.resetTime,
        };
    }
    
    // Increment count
    currentEntry.count++;
    
    return {
        allowed: true,
        remaining: options.maxRequests - currentEntry.count,
        resetTime: currentEntry.resetTime,
    };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Helper to get client IP from request
export function getClientIdentifier(request: Request): string {
    // Use IP + User-Agent as identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent.slice(0, 50)}`;
}
