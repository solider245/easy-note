'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import NoteList from '@/components/NoteList';
import MilkdownEditor from '@/components/Editor';
import { LoadingSkeleton } from '@/components/Skeleton';
import SecurityWarning from '@/components/SecurityWarning';
import UsageBanner from '@/components/UsageBanner';
import { Note, NoteMeta } from '@/lib/types';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import { Pin, Trash2, Settings, Download, LogOut, Menu, Tag, X } from 'lucide-react';

export default function AppMain({ isUsingDefaultPass }: { isUsingDefaultPass: boolean }) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({ used: 0, total: 250 * 1024 * 1024 });
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load notes list
  const fetchNotes = useCallback(async (query?: string) => {
    try {
      const url = query ? `/api/notes?q=${encodeURIComponent(query)}` : '/api/notes';
      const res = await fetch(url);
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
        const usageRes = await fetch('/api/status');
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          if (usageData.usage) setUsage(usageData.usage);
        }
      } catch (e) {
        console.error('Initialization failed', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchNotes]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Cmd+N: new note (not when typing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isEditing) {
        e.preventDefault();
        handleCreateNote();
      }
      // Escape: deselect note on mobile / close tag input
      if (e.key === 'Escape') {
        if (showTagInput) {
          setShowTagInput(false);
          setTagInput('');
        }
      }
      // Cmd+Delete: delete selected note
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && selectedNote && !isEditing) {
        e.preventDefault();
        handleDeleteNote(selectedNote.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNote, showTagInput]);

  // Focus tag input when shown
  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  // Debounced title update
  const debouncedTitleUpdate = useMemo(
    () => debounce(async (id: string, title: string) => {
      await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    }, 600),
    []
  );

  // Debounced content update
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
      } catch {
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
        setShowTagInput(false);
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
        setNotes(prev => [newNote, ...prev]);
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
    if (!confirm('Move this note to Trash? You can restore it from the Trash page.')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedNote?.id === id) setSelectedNote(null);
        setNotes(prev => prev.filter(n => n.id !== id));
        toast.success('Note moved to Trash', {
          action: { label: 'View Trash', onClick: () => router.push('/trash') },
        });
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

  const handleAddTag = async (tag: string) => {
    if (!selectedNote || !tag.trim()) return;
    const trimmed = tag.trim().toLowerCase().replace(/\s+/g, '-');
    const currentTags = selectedNote.tags || [];
    if (currentTags.includes(trimmed)) {
      toast.info('Tag already exists');
      return;
    }
    const newTags = [...currentTags, trimmed];
    setSelectedNote({ ...selectedNote, tags: newTags });
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, tags: newTags } : n));
    setTagInput('');
    setShowTagInput(false);
    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
    } catch {
      toast.error('Failed to save tag');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedNote) return;
    const newTags = (selectedNote.tags || []).filter(t => t !== tag);
    setSelectedNote({ ...selectedNote, tags: newTags });
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, tags: newTags } : n));
    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
    } catch {
      toast.error('Failed to remove tag');
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
        <div className={`w-full md:w-72 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${selectedNote ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-hidden">
            <NoteList
              notes={notes}
              selectedId={selectedNote?.id || null}
              onSelect={handleSelectNote}
              onNew={handleCreateNote}
              onSearch={fetchNotes}
            />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <button
              onClick={() => router.push('/trash')}
              className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Trash
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={handleExport}
              className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!selectedNote ? 'hidden md:flex' : 'flex'}`}>
          {selectedNote ? (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <input
                    className="text-xl md:text-2xl font-bold bg-transparent border-none outline-none w-full truncate"
                    value={selectedNote.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setSelectedNote({ ...selectedNote, title: newTitle });
                      setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
                      debouncedTitleUpdate(selectedNote.id, newTitle);
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isSaving && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700/50 mr-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Saving</span>
                    </div>
                  )}
                  {/* Tag button */}
                  <button
                    onClick={() => setShowTagInput(v => !v)}
                    className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${showTagInput ? 'text-blue-500' : 'text-gray-400'}`}
                    title="Add Tag"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  {/* Pin button */}
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${selectedNote.isPinned ? 'text-blue-500' : 'text-gray-400'}`}
                    title={selectedNote.isPinned ? 'Unpin' : 'Pin to Top'}
                  >
                    <Pin className="h-5 w-5" />
                  </button>
                  {/* AI title button */}
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
                        setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
                        toast.success('Title updated by AI');
                      }
                    }}
                    className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                    title="Suggest Title with AI"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="Delete Note (⌘⌫)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tags bar */}
              {((selectedNote.tags && selectedNote.tags.length > 0) || showTagInput) && (
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap bg-gray-50/50 dark:bg-gray-800/30">
                  {(selectedNote.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {showTagInput && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAddTag(tagInput); }}
                      className="flex items-center gap-1"
                    >
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="tag name…"
                        className="text-xs border border-blue-300 dark:border-blue-700 rounded-full px-2 py-0.5 outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-800 w-24"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { setShowTagInput(false); setTagInput(''); }
                        }}
                      />
                      <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Add</button>
                    </form>
                  )}
                </div>
              )}

              {/* Editor */}
              <div className="flex-1 overflow-auto p-8 prose dark:prose-invert max-w-none">
                <MilkdownEditor
                  content={selectedNote.content}
                  onChange={handleUpdateNote}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-3 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Select a note to start writing</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">⌘N</kbd> to create a new note</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
