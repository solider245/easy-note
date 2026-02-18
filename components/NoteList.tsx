import { NoteMeta } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Search, Plus, Pin } from 'lucide-react';

interface NoteListProps {
    notes: NoteMeta[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onSearch?: (query: string) => void;
}

export default function NoteList({ notes, selectedId, onSelect, onNew, onSearch }: NoteListProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">All Notes</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onNew}
                        className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
                        title="New Note"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        className="w-full bg-white dark:bg-gray-800 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>
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
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">{note.title}</h3>
                                {note.isPinned && <Pin className="w-3 h-3 text-blue-600 fill-blue-600 flex-shrink-0" />}
                            </div>
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
