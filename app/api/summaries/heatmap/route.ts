import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Get writing heatmap data (GitHub-style contributions)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get('year');
        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        
        const db = await getDb();
        const isSQLite = process.env.DATABASE_URL?.startsWith('libsql://') || 
                        process.env.DATABASE_URL?.startsWith('file:') ||
                        process.env.TURSO_DATABASE_URL?.startsWith('libsql://');
        
        let query: string;
        
        if (isSQLite) {
            query = `
                SELECT 
                    date,
                    note_count,
                    total_words,
                    CASE 
                        WHEN total_words >= 2000 THEN 4
                        WHEN total_words >= 1000 THEN 3
                        WHEN total_words >= 500 THEN 2
                        WHEN total_words > 0 THEN 1
                        ELSE 0
                    END as level
                FROM daily_writing_stats 
                WHERE date >= '${year}-01-01' AND date <= '${year}-12-31'
                ORDER BY date ASC
            `;
        } else {
            query = `
                SELECT 
                    date,
                    note_count,
                    total_words,
                    CASE 
                        WHEN total_words >= 2000 THEN 4
                        WHEN total_words >= 1000 THEN 3
                        WHEN total_words >= 500 THEN 2
                        WHEN total_words > 0 THEN 1
                        ELSE 0
                    END as level
                FROM daily_writing_stats 
                WHERE date >= '${year}-01-01' AND date <= '${year}-12-31'
                ORDER BY date ASC
            `;
        }
        
        const result = await (db as any).execute(query);
        const heatmapData = result.rows || [];
        
        // Calculate streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        const today = new Date().toISOString().split('T')[0];
        
        // Convert to array of all dates in the year
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        const dateMap = new Map(heatmapData.map((d: any) => [d.date, d]));
        
        // Calculate streak from today backwards
        const checkDate = new Date();
        while (checkDate >= yearStart) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const dayData = dateMap.get(dateStr);
            
            if (dayData && (dayData as any).total_words > 0) {
                if (dateStr <= today) {
                    currentStreak++;
                }
                tempStreak++;
            } else {
                if (dateStr <= today) {
                    break; // Streak broken
                }
                tempStreak = 0;
            }
            
            longestStreak = Math.max(longestStreak, tempStreak);
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        const activeDays = heatmapData.filter((d: any) => (d.total_words || 0) > 0);
        const totalWords = heatmapData.reduce((sum: number, d: any) => sum + (d.total_words || 0), 0);
        
        const stats = {
            year,
            total_days: heatmapData.length,
            active_days: activeDays.length,
            total_words: totalWords,
            total_notes: heatmapData.reduce((sum: number, d: any) => sum + (d.note_count || 0), 0),
            current_streak: currentStreak,
            longest_streak: longestStreak,
            avg_words_per_day: activeDays.length > 0
                ? Math.round(totalWords / activeDays.length)
                : 0,
        };
        
        return NextResponse.json({ 
            heatmap: heatmapData,
            stats 
        });
    } catch (e: unknown) {
        console.error('[API] GET /api/summaries/heatmap error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
