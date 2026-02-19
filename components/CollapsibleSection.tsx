'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    defaultCollapsed?: boolean;
    icon?: ReactNode;
    badge?: string;
}

export default function CollapsibleSection({
    title,
    children,
    defaultCollapsed = true,
    icon,
    badge
}: CollapsibleSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-gray-500">{icon}</span>}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
                    {badge && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
            </button>
            
            {!isCollapsed && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
}
