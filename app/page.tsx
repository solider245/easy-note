import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/Skeleton';
import AppMain from '@/components/AppMain';

export default function Page() {
    // Show default password warning if no ADMIN_PASSWORD environment variable is set
    // Note: This checks env var only. If user changed password via UI, it's saved to database
    // and we rely on client-side check to hide the warning
    const usingDefaultPass = !process.env.ADMIN_PASSWORD;

    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <AppMain isUsingDefaultPass={usingDefaultPass} />
        </Suspense>
    );
}
