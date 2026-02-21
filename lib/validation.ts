/**
 * API Input Validation Schemas
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

// Note schemas
export const createNoteSchema = z.object({
    title: z.string().max(200, 'Title too long').optional(),
    content: z.string().max(100000, 'Content too long').optional(),
});

export const updateNoteSchema = z.object({
    title: z.string().max(200, 'Title too long').optional(),
    content: z.string().max(100000, 'Content too long').optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(50, 'Too many tags').optional(),
    folder_path: z.string().max(500).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    priority: z.number().min(0).max(5).optional(),
});

// Auth schemas
export const loginSchema = z.object({
    password: z.string().min(1, 'Password required').max(100, 'Password too long'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password required').max(100),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

// Settings schemas
export const updateSettingSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string().max(10000),
});

// Share schemas
export const createShareSchema = z.object({
    expiresIn: z.number().min(1).max(365).optional(), // days
});

// AI schemas
export const aiCompleteSchema = z.object({
    prompt: z.string().min(1).max(5000),
    noteId: z.string().optional(),
});

export const aiProcessSchema = z.object({
    text: z.string().min(1).max(10000),
    action: z.enum(['summarize', 'expand', 'fix']),
});

// Helper function to validate request body
export async function validateRequest<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const body = await request.json();
        const data = schema.parse(body);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Validation error: ${messages}` };
        }
        return { success: false, error: 'Invalid request body' };
    }
}

// Helper to validate query params
export function validateQuery(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<any>
): { success: true; data: any } | { success: false; error: string } {
    try {
        const params: Record<string, any> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        const data = schema.parse(params);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Validation error: ${messages}` };
        }
        return { success: false, error: 'Invalid query parameters' };
    }
}
