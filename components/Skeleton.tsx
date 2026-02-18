import React from 'react';

export const LoadingSkeleton: React.FC = () => {
    return (
        <div className="flex flex-1 overflow-hidden animate-pulse">
            {/* Sidebar Skeleton */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
            {/* Editor Skeleton */}
            <div className="flex-1 p-8 space-y-6 bg-white dark:bg-gray-900">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-10"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/5"></div>
                </div>
            </div>
        </div>
    );
};
