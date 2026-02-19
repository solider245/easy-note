'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { NoteMeta } from '@/lib/types';
import { Search, FileText, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommandPaletteProps {
    notes: NoteMeta[];
    onSelect: (id: string) => void;
    onNew: () => void;
    onClose: () => void;
}

interface PaletteItem {
    id: string;
    label: string;
    icon: ReactNode;
    subtitle?: string;
    action: () => void;
}

export default function CommandPalette({ notes, onSelect, onNew, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filtered = query.trim()
        ? notes.filter(n =>
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            (n.preview || '').toLowerCase().includes(query.toLowerCase()) ||
            (n.tags || []).some(t => t.includes(query.toLowerCase()))
        )
        : notes.slice(0, 8);

    const allItems: PaletteItem[] = [
        { id: '__new__', label: 'New Note', icon: <Plus className="h-4 w-4" />, action: () => { onNew(); onClose(); } },
        ...filtered.map(n => ({
            id: n.id,
            label: n.title,
            icon: <FileText className="h-4 w-4 text-gray-400" /> as ReactNode,
            subtitle: n.preview || formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true }),
            action: () => { onSelect(n.id); onClose(); },
        })),
    ];

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            allItems[activeIndex]?.action();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [allItems, activeIndex, onClose]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.children[activeIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search notes or type a command…"
                        className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                    />
                    <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
                    {allItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                            No results for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        allItems.map((item, i) => (
                            <button
                                key={item.id}
                                onClick={item.action}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIndex
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <span className={`flex-shrink-0 ${i === activeIndex ? 'text-blue-500' : ''}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${i === activeIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {item.label}
                                    </p>
                                    {'subtitle' in item && item.subtitle && (
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                                    )}
                                </div>
                                {i === activeIndex && (
                                    <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">↵</kbd>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-[10px] text-gray-400">
                    <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                    <span><kbd className="font-mono">↵</kbd> select</span>
                    <span><kbd className="font-mono">ESC</kbd> close</span>
                </div>
            </div>
        </div>
    );
}
