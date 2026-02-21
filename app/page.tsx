import { Suspense } from 'react';
import AppMain from '@/components/AppMain';
import { NoteMeta } from '@/lib/types';

// Server-side data fetching for instant loading
async function getInitialNotes(): Promise<NoteMeta[]> {
  try {
    // Only fetch on server, skip during static generation
    if (typeof window !== 'undefined') return [];
    
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL;
    
    // If no base URL (static generation), return empty and let client fetch
    if (!baseUrl) return [];
    
    const res = await fetch(`${baseUrl}/api/notes`, {
      next: { revalidate: 0 },
      headers: {
        'Cookie': '', // Server-side request without auth cookie
      },
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    // Silently fail during build/static generation
    return [];
  }
}

export default async function Page() {
  // Show default password warning if no ADMIN_PASSWORD environment variable is set
  const usingDefaultPass = !process.env.ADMIN_PASSWORD;
  
  // Fetch notes on server for instant hydration
  const initialNotes = await getInitialNotes();

  return (
    <Suspense fallback={null}>
      <AppMain 
        isUsingDefaultPass={usingDefaultPass} 
        initialNotes={initialNotes}
      />
    </Suspense>
  );
}
