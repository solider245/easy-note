'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Trash2, ChevronLeft, RotateCcw, Trash,
    AlertCircle, Loader2, Search, Calendar, Ghost
} from 'lucide-react';
import { NoteMeta } from '@/lib/types';

export default function TrashPage() {
    const [notes, setNotes] = useState<NoteMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActioning, setIsActioning] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchTrash = async () => {
        try {
            const res = await fetch('/api/notes/trash');
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (e) {
            toast.error('Failed to load trash');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleRestore = async (id: string) => {
        setIsActioning(id);
        try {
            const res = await fetch(`/api/notes/${id}/restore`, { method: 'POST' });
            if (res.ok) {
                toast.success('Note restored');
                setNotes(notes.filter(n => n.id !== id));
            } else {
                toast.error('Failed to restore note');
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setIsActioning(null);
        }
    };

    const handlePurge = async (id: string) => {
        if (!confirm('Permanently delete this note? This action cannot be undone.')) return;
        setIsActioning(id);
        try {
            const res = await fetch(`/api/notes/${id}?purge=true`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Note permanently deleted');
                setNotes(notes.filter(n => n.id !== id));
            } else {
                toast.error('Failed to delete note');
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setIsActioning(null);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Are you sure you want to empty the trash? All items will be permanently deleted.')) return;
        setLoading(true);
        try {
            for (const note of notes) {
                await fetch(`/api/notes/${note.id}?purge=true`, { method: 'DELETE' });
            }
            setNotes([]);
            toast.success('Trash emptied');
        } catch {
            toast.error('Failed to empty trash completely');
        } finally {
            setLoading(false);
        }
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Trash2 className="h-8 w-8 text-red-500" />
                                Trash Bin
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Manage or restore deleted notes</p>
                        </div>
                    </div>

                    {notes.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm flex items-center gap-2"
                        >
                            <Trash className="h-4 w-4" />
                            Empty Trash
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search deleted notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                        <p className="text-gray-500">Scanning the trash...</p>
                    </div>
                ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between group transition-all hover:border-blue-200 dark:hover:border-blue-900"
                            >
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {note.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-4" />
                                            Deleted {new Date(note.deletedAt!).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRestore(note.id)}
                                        disabled={isActioning === note.id}
                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        title="Restore"
                                    >
                                        {isActioning === note.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={() => handlePurge(note.id)}
                                        disabled={isActioning === note.id}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        title="Delete Permanently"
                                    >
                                        {isActioning === note.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <Ghost className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">Trash is empty</h3>
                            <p className="text-gray-500">Deleted notes will appear here for 30 days.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
