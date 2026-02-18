'use client';

import { useState, useEffect, useCallback } from 'react';
import NoteList from '@/components/NoteList';
import MilkdownEditor from '@/components/Editor';
import SecurityWarning from '@/components/SecurityWarning';
import UsageBanner from '@/components/UsageBanner';
import { Note, NoteMeta } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AppMain({ isUsingDefaultPass }: { isUsingDefaultPass: boolean }) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage] = useState({ used: 0, total: 250 * 1024 * 1024 });
  const [storageStatus, setStorageStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Load notes list
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {
      console.error('Failed to fetch notes');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();
        if (statusData.status === 'connected') {
          setStorageStatus('connected');
          await fetchNotes();
        } else {
          setStorageStatus('error');
          setErrorMessage(statusData.hint || statusData.message);
        }
      } catch {
        setStorageStatus('error');
        setErrorMessage('Failed to connect to the backend.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchNotes]);

  const handleSelectNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNote(data);
      }
    } catch {
      console.error('Failed to fetch note');
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Note', content: '' }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
      }
    } catch {
      console.error('Failed to create note');
    }
  };

  const handleUpdateNote = async (content: string) => {
    if (!selectedNote) return;

    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedNote(updated);
        // Only update the list meta if title changed (here it doesn't from editor)
        setNotes(notes.map(n => n.id === updated.id ? { ...n, updatedAt: updated.updatedAt } : n));
      }
    } catch {
      console.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedNote?.id === id) setSelectedNote(null);
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch {
      console.error('Failed to delete note');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleExport = () => {
    window.open('/api/export');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const isDemoMode = storageStatus === 'error';

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {isUsingDefaultPass && <SecurityWarning />}
      {isDemoMode && (
        <div className="bg-amber-500 px-4 py-1 text-white text-center text-xs font-bold uppercase tracking-wider">
          Demo Mode: Changes will not be saved. Connect Vercel Blob to enable persistent storage.
        </div>
      )}
      <UsageBanner used={usage.used} total={usage.total} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <NoteList
            notes={notes}
            selectedId={selectedNote?.id || null}
            onSelect={handleSelectNote}
            onNew={handleCreateNote}
          />
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={handleExport}
              className="w-full py-2 px-4 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedNote ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <input
                  className="text-2xl font-bold bg-transparent border-none outline-none w-full"
                  value={selectedNote.title}
                  onChange={async (e) => {
                    const newTitle = e.target.value;
                    setSelectedNote({ ...selectedNote, title: newTitle });
                    // Debounce title update or update on blur? Let's do a quick update.
                    await fetch(`/api/notes/${selectedNote.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: newTitle }),
                    });
                    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
                  }}
                />
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  title="Delete Note"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-8 prose dark:prose-invert max-w-none">
                <MilkdownEditor
                  content={selectedNote.content}
                  onChange={handleUpdateNote}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select or create a note to start writing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
