'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Database, ChevronRight } from 'lucide-react';

interface DemoModeBannerProps {
    onConfigure?: () => void;
}

export default function DemoModeBanner({ onConfigure }: DemoModeBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [storageType, setStorageType] = useState<string | null>(null);

    useEffect(() => {
        // Check storage type on mount
        fetch('/api/database/status')
            .then(res => res.json())
            .then(data => {
                setStorageType(data.storageType);
                // Only show if in demo mode
                setIsVisible(data.storageType === 'memory');
            })
            .catch(() => {
                // If API fails, assume demo mode
                setStorageType('memory');
                setIsVisible(true);
            });
    }, []);

    // Don't render if not in demo mode or dismissed
    if (!isVisible || storageType !== 'memory') {
        return null;
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Demo Mode: Data is stored in memory
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Your notes will be lost when the server restarts. 
                                <span className="hidden sm:inline"> Connect a database for persistent storage.</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={onConfigure}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Database className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Configure Database</span>
                            <span className="sm:hidden">Setup</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800 rounded-lg transition-colors"
                            title="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
