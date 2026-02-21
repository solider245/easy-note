'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Wand2, Type, Eye, Edit3, Save, Check, Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { useCompletion } from 'ai/react';

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
    hasUnsavedChanges?: boolean;
    isSaving?: boolean;
    lastSavedAt?: Date | null;
    onManualSave?: () => void;
}

export default function SimpleEditor({ 
    content, 
    onChange, 
    hasUnsavedChanges = false,
    isSaving = false,
    lastSavedAt = null,
    onManualSave 
}: EditorProps) {
    const [isPreview, setIsPreview] = useState(false);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const { complete, completion, isLoading } = useCompletion({
        api: '/api/ai/complete',
        onFinish: () => {
            toast.success('AI completion finished');
        }
    });

    // Handle AI completion insertion
    useEffect(() => {
        if (completion && !isLoading) {
            const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = content.substring(0, start) + completion + content.substring(end);
                onChange(newContent);
                // Restore cursor position
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + completion.length;
                    textarea.focus();
                }, 0);
            }
        }
    }, [completion, isLoading, content, onChange]);

    const handleAIComplete = async () => {
        if (isLoading) return;
        const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBefore = content.substring(Math.max(0, cursorPos - 500), cursorPos);
        
        await complete('', { body: { context: textBefore } });
    };

    const handleAIAction = async (type: 'summarize' | 'improve') => {
        const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const textToProcess = selectedText || content;

        const res = await fetch('/api/ai/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: textToProcess, type }),
        });

        if (res.ok) {
            const { result } = await res.json();
            if (selectedText) {
                // Replace selection
                const newContent = content.substring(0, start) + result + content.substring(end);
                onChange(newContent);
            } else {
                // Replace all
                onChange(result);
            }
            toast.success(`${type === 'summarize' ? 'Summarized' : 'Improved'}!`);
        }
    };

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = document.getElementById('note-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newText = before + selectedText + after;
        
        const newContent = content.substring(0, start) + newText + content.substring(end);
        onChange(newContent);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => insertMarkdown('**', '**')}
                        className="px-2 py-1 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        onClick={() => insertMarkdown('*', '*')}
                        className="px-2 py-1 text-sm italic hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Italic"
                    >
                        I
                    </button>
                    <button
                        onClick={() => insertMarkdown('# ')}
                        className="px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Heading"
                    >
                        H1
                    </button>
                    <button
                        onClick={() => insertMarkdown('## ')}
                        className="px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => insertMarkdown('- ')}
                        className="px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="List"
                    >
                        •
                    </button>
                    <button
                        onClick={() => insertMarkdown('```\n', '\n```')}
                        className="px-2 py-1 text-sm font-mono hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Code Block"
                    >
                        {'<>'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* AI Buttons */}
                    <button
                        onClick={handleAIComplete}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                        title="Continue Writing (Cmd+Shift+A)"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isLoading ? 'Writing...' : 'AI Continue'}
                    </button>
                    <button
                        onClick={() => handleAIAction('summarize')}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                        title="Summarize"
                    >
                        <Wand2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleAIAction('improve')}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        title="Improve"
                    >
                        <Type className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Save Status & Button */}
                    {onManualSave && (
                        <>
                            <button
                                onClick={onManualSave}
                                disabled={isSaving || !hasUnsavedChanges}
                                className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                                title="Save to cloud (Ctrl+S)"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : hasUnsavedChanges ? (
                                    <>
                                        <CloudOff className="w-4 h-4 text-amber-500" />
                                        <span className="text-amber-600">Unsaved</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-green-600">Saved</span>
                                    </>
                                )}
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                        </>
                    )}

                    {/* Preview Toggle */}
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                        {isPreview ? (
                            <>
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                Preview
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 overflow-auto">
                {isPreview ? (
                    <div className="prose dark:prose-invert max-w-none p-8">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content || 'Start writing...'}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        id="note-editor"
                        value={content}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Start writing your note..."
                        className="w-full h-full p-8 resize-none outline-none font-mono text-sm leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        spellCheck={false}
                    />
                )}
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 flex justify-between">
                <span>
                    {content.split(/\s+/).filter(Boolean).length} words
                    {' • '}
                    {content.length} characters
                </span>
                <span className="flex items-center gap-2">
                    {onManualSave && (
                        <>
                            {hasUnsavedChanges ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <CloudOff className="w-3 h-3" />
                                    Unsaved changes
                                </span>
                            ) : lastSavedAt ? (
                                <span className="text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Saved {lastSavedAt.toLocaleTimeString()}
                                </span>
                            ) : (
                                <span className="text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Saved locally
                                </span>
                            )}
                            {' • '}
                        </>
                    )}
                    {isPreview ? 'Preview Mode' : 'Edit Mode'}
                    {' • '}
                    Markdown
                </span>
            </div>
        </div>
    );
}
