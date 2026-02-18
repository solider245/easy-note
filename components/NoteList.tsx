'use client';

import { NoteMeta } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface NoteListProps {
    notes: NoteMeta[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
}

export default function NoteList({ notes, selectedId, onSelect, onNew }: NoteListProps) {
    return (
        <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">All Notes</h2>
                <button
                    onClick={onNew}
                    className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
                    title="New Note"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {notes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic">No notes yet...</div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => onSelect(note.id)}
                            className={`p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedId === note.id ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-600' : ''
                                }`}
                        >
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{note.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
