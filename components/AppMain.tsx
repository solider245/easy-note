'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import NoteList from '@/components/NoteList';
import MilkdownEditor from '@/components/Editor';
import { LoadingSkeleton } from '@/components/Skeleton';
import SecurityWarning from '@/components/SecurityWarning';
import UsageBanner from '@/components/UsageBanner';
import { Note, NoteMeta } from '@/lib/types';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import { Pin } from 'lucide-react';

export default function AppMain({ isUsingDefaultPass }: { isUsingDefaultPass: boolean }) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage] = useState({ used: 0, total: 250 * 1024 * 1024 });
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
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
        await fetchNotes();
        const configRes = await fetch('/api/status/config');
        const configData = await configRes.json();
        setConfig(configData);
      } catch (e) {
        console.error('Initialization failed', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchNotes]);

  // Debounced update functions
  const debouncedUpdate = useMemo(
    () => debounce(async (id: string, updates: Partial<Note>, currentTitle?: string) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes(prev => prev.map(n => n.id === updated.id ? { ...n, ...updates, updatedAt: updated.updatedAt } : n));

          if (currentTitle === 'New Note' && updates.content && updates.content.length > 50) {
            const aiRes = await fetch('/api/ai/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: updates.content, type: 'suggest-title' }),
            });
            if (aiRes.ok) {
              const { result: suggestedTitle } = await aiRes.json();
              if (suggestedTitle && suggestedTitle !== 'New Note') {
                await fetch(`/api/notes/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: suggestedTitle }),
                });
                setNotes(prev => prev.map(n => n.id === id ? { ...n, title: suggestedTitle } : n));
                setSelectedNote(prev => prev?.id === id ? { ...prev, title: suggestedTitle } : prev);
                toast.info(`Note automatically titled: ${suggestedTitle}`);
              }
            }
          }
        }
      } catch (e) {
        toast.error('Failed to auto-save note');
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    []
  );

  const handleSelectNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNote(data);
      }
    } catch {
      toast.error('Failed to load note');
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
        toast.success('Note created');
      }
    } catch {
      toast.error('Failed to create note');
    }
  };

  const handleUpdateNote = (content: string) => {
    if (!selectedNote) return;
    setSelectedNote({ ...selectedNote, content });
    debouncedUpdate(selectedNote.id, { content }, selectedNote.title);
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedNote?.id === id) setSelectedNote(null);
        setNotes(notes.filter(n => n.id !== id));
        toast.success('Note deleted');
      }
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNote) return;
    const newPinned = !selectedNote.isPinned;
    setSelectedNote({ ...selectedNote, isPinned: newPinned });
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, isPinned: newPinned } : n));

    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinned }),
      });
      toast.success(newPinned ? 'Note pinned' : 'Note unpinned');
    } catch {
      toast.error('Failed to update pin status');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleExport = () => {
    window.open('/api/export');
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Banners */}
      {isUsingDefaultPass && <SecurityWarning />}

      {config?.activeStorage === 'Local Memory (Demo)' && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-500">
          <span className="text-amber-800 dark:text-amber-300 text-xs font-medium">
            ⚠️ <strong>Guest Mode:</strong> Changes are temporary. Connect a database or Vercel Blob for persistent storage.
          </span>
          <button
            onClick={() => window.open('https://github.com/solider245/easy-note#deployment', '_blank')}
            className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors uppercase font-bold"
          >
            Setup Guide
          </button>
        </div>
      )}

      {config?.activeStorage === 'Vercel Blob' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 px-4 py-1.5 flex items-center justify-center">
          <span className="text-blue-700 dark:text-blue-300 text-[10px] font-semibold uppercase tracking-widest">
            ☁️ Cloud Storage Active (Vercel Blob)
          </span>
        </div>
      )}

      {config?.activeStorage === 'Database' && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 px-4 py-1.5 flex items-center justify-center">
          <span className="text-green-700 dark:text-green-400 text-[10px] font-semibold uppercase tracking-widest leading-none">
            ⚡ Ultra-Fast Database Active ({config.database.type})
          </span>
        </div>
      )}

      <UsageBanner used={usage.used} total={usage.total} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-hidden">
            <NoteList
              notes={notes}
              selectedId={selectedNote?.id || null}
              onSelect={handleSelectNote}
              onNew={handleCreateNote}
              onSearch={async (query) => {
                const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
                if (res.ok) {
                  const filtered = await res.json();
                  setNotes(filtered);
                }
              }}
            />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={() => router.push('/settings')}
              className="w-full py-2 px-4 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
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
                    await fetch(`/api/notes/${selectedNote.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: newTitle }),
                    });
                    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
                  }}
                />
                <div className="flex items-center gap-1">
                  {isSaving && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700/50 mr-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Saving</span>
                    </div>
                  )}
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${selectedNote.isPinned ? 'text-blue-500' : 'text-gray-400'}`}
                    title={selectedNote.isPinned ? 'Unpin' : 'Pin to Top'}
                  >
                    <Pin className="h-5 w-5" />
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/ai/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: selectedNote.content, type: 'suggest-title' }),
                      });
                      if (res.ok) {
                        const { result: newTitle } = await res.json();
                        setSelectedNote({ ...selectedNote, title: newTitle });
                        await fetch(`/api/notes/${selectedNote.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title: newTitle }),
                        });
                        setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
                      }
                    }}
                    className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                    title="Suggest Title with AI"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
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
