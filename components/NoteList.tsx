'use client';

import { NoteMeta } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Search, Plus, Pin, SortAsc, SortDesc, Clock, Tag, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';

type SortKey = 'updatedAt' | 'createdAt' | 'title';
type SortDir = 'desc' | 'asc';

interface NoteListProps {
    notes: NoteMeta[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onSearch?: (query: string) => void;
    searchQuery?: string;
}

function highlight(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-sm px-0.5">{part}</mark>
            : part
    );
}

export default function NoteList({ notes, selectedId, onSelect, onNew, onSearch, searchQuery = '' }: NoteListProps) {
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [showSort, setShowSort] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [showTags, setShowTags] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((q: string) => onSearch?.(q), 300),
        [onSearch]
    );

    useEffect(() => {
        debouncedSearch(localQuery);
        return () => debouncedSearch.cancel();
    }, [localQuery, debouncedSearch]);

    // Cmd+K to focus search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Close sort dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setShowSort(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Aggregate all tags from notes
    const allTags = useMemo(() => {
        const tagCount: Record<string, number> = {};
        for (const note of notes) {
            for (const tag of note.tags || []) {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            }
        }
        return Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }, [notes]);

    // Filter by active tag, then sort
    const sorted = useMemo(() => {
        let filtered = activeTag
            ? notes.filter(n => (n.tags || []).includes(activeTag))
            : notes;

        return [...filtered].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            let cmp = 0;
            if (sortKey === 'title') {
                cmp = a.title.localeCompare(b.title);
            } else {
                cmp = (a[sortKey] as number) - (b[sortKey] as number);
            }
            return sortDir === 'desc' ? -cmp : cmp;
        });
    }, [notes, activeTag, sortKey, sortDir]);

    const sortLabels: Record<SortKey, string> = {
        updatedAt: 'Last Modified',
        createdAt: 'Date Created',
        title: 'Title',
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Notes</h2>
                <div className="flex gap-1.5 items-center">
                    {/* Tags filter toggle */}
                    {allTags.length > 0 && (
                        <button
                            onClick={() => setShowTags(v => !v)}
                            className={`p-1.5 rounded-lg transition-colors ${showTags || activeTag ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title="Filter by tag"
                        >
                            <Tag className="h-4 w-4" />
                        </button>
                    )}
                    {/* Sort dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setShowSort(v => !v)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sort"
                        >
                            {sortDir === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                        </button>
                        {showSort && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 text-sm">
                                {(['updatedAt', 'createdAt', 'title'] as SortKey[]).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                                            else { setSortKey(key); setSortDir('desc'); }
                                            setShowSort(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortKey === key ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 opacity-60" />
                                            {sortLabels[key]}
                                        </span>
                                        {sortKey === key && (
                                            <span className="text-xs opacity-60">{sortDir === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onNew}
                        className="rounded-full bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition-colors"
                        title="New Note (⌘N)"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Tag filter bar */}
            {showTags && allTags.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setActiveTag(null)}
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${!activeTag ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            All
                        </button>
                        {allTags.map(({ name, count }) => (
                            <button
                                key={name}
                                onClick={() => setActiveTag(activeTag === name ? null : name)}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${activeTag === name ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}
                            >
                                #{name}
                                <span className={`text-[9px] ${activeTag === name ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active tag indicator */}
            {activeTag && !showTags && (
                <div className="px-3 py-1.5 border-b border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">#{activeTag}</span>
                    <button onClick={() => setActiveTag(null)} className="text-blue-400 hover:text-blue-600 transition-colors">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search… (⌘K)"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-8 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                    />
                    {localQuery && (
                        <button
                            onClick={() => { setLocalQuery(''); onSearch?.(''); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Note count */}
            {(localQuery || activeTag) && (
                <div className="px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800">
                    {sorted.length === 0
                        ? 'No results'
                        : `${sorted.length} note${sorted.length !== 1 ? 's' : ''}${localQuery ? ` for "${localQuery}"` : ''}${activeTag ? ` tagged #${activeTag}` : ''}`
                    }
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                        {localQuery || activeTag ? (
                            <>
                                <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notes match</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                                    <Plus className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No notes yet</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click + to create your first note</p>
                            </>
                        )}
                    </div>
                ) : (
                    sorted.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => onSelect(note.id)}
                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors border-b border-gray-100 dark:border-gray-700/50 ${selectedId === note.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                                : 'border-l-2 border-l-transparent'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate flex-1 leading-snug">
                                    {highlight(note.title, localQuery)}
                                </h3>
                                {note.isPinned && (
                                    <Pin className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0 mt-0.5" />
                                )}
                            </div>
                            {'preview' in note && (note as any).preview && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                    {highlight((note as any).preview, localQuery)}
                                </p>
                            )}
                            {/* Tags */}
                            {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {note.tags.slice(0, 3).map(tag => (
                                        <span
                                            key={tag}
                                            onClick={(e) => { e.stopPropagation(); setActiveTag(tag); setShowTags(false); }}
                                            className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer transition-colors ${activeTag === tag ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                    {note.tags.length > 3 && (
                                        <span className="text-[10px] text-gray-400">+{note.tags.length - 3}</span>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                </p>
                                {'wordCount' in note && (note as any).wordCount > 0 && (
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {(note as any).wordCount} words
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
