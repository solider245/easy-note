import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Get daily writing statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const days = parseInt(searchParams.get('days') || '365', 10);
        
        const db = await getDb();
        const isSQLite = process.env.DATABASE_URL?.startsWith('libsql://') || 
                        process.env.DATABASE_URL?.startsWith('file:') ||
                        process.env.TURSO_DATABASE_URL?.startsWith('libsql://');
        
        let query: string;
        let params: any[] = [];
        
        if (year) {
            // Get data for specific year
            if (isSQLite) {
                query = `
                    SELECT * FROM daily_writing_stats 
                    WHERE date LIKE ? 
                    ORDER BY date DESC
                `;
                params = [`${year}%`];
            } else {
                query = `
                    SELECT * FROM daily_writing_stats 
                    WHERE date LIKE $1 
                    ORDER BY date DESC
                `;
                params = [`${year}%`];
            }
        } else {
            // Get recent days
            if (isSQLite) {
                query = `
                    SELECT * FROM daily_writing_stats 
                    WHERE date >= date('now', '-${days} days')
                    ORDER BY date DESC
                `;
            } else {
                query = `
                    SELECT * FROM daily_writing_stats 
                    WHERE date >= TO_CHAR(CURRENT_DATE - INTERVAL '${days} days', 'YYYY-MM-DD')
                    ORDER BY date DESC
                `;
            }
        }
        
        const result = await (db as any).execute(query, params);
        const stats = result.rows || [];
        
        // Calculate summary
        const summary = {
            total_days: stats.length,
            total_notes: stats.reduce((sum: number, s: any) => sum + (s.note_count || 0), 0),
            total_words: stats.reduce((sum: number, s: any) => sum + (s.total_words || 0), 0),
            total_read_time: stats.reduce((sum: number, s: any) => sum + (s.total_read_time || 0), 0),
            avg_words_per_day: stats.length > 0 
                ? Math.round(stats.reduce((sum: number, s: any) => sum + (s.total_words || 0), 0) / stats.length)
                : 0,
            max_words_day: stats.length > 0
                ? stats.reduce((max: any, s: any) => (s.total_words > max.total_words ? s : max), stats[0])
                : null,
        };
        
        return NextResponse.json({ stats, summary });
    } catch (e: unknown) {
        console.error('[API] GET /api/summaries/writing error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
