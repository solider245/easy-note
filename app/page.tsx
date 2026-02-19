import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/Skeleton';
import AppMain from '@/components/AppMain';

export default function Page() {
    // Show default password warning if no ADMIN_PASSWORD is configured
    const usingDefaultPass = !process.env.ADMIN_PASSWORD;

    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <AppMain isUsingDefaultPass={usingDefaultPass} />
        </Suspense>
    );
}
