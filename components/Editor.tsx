'use client';

import React, { useState, useEffect } from 'react';
import { Milkdown, useEditor, MilkdownProvider } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { useCompletion } from 'ai/react';
import { Sparkles, Wand2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { replaceAll } from '@milkdown/utils';

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

const EditorImpl: React.FC<EditorProps> = ({ content, onChange }) => {
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [lastCompletionLength, setLastCompletionLength] = useState(0);
    const [streamInsertPos, setStreamInsertPos] = useState<number | null>(null);

    const { complete, completion, isLoading } = useCompletion({
        api: '/api/ai/complete',
        onResponse: () => {
            const view = editorInstance?.action((ctx) => ctx.get(editorViewCtx));
            if (view) {
                setStreamInsertPos(view.state.selection.to);
            }
        },
        onFinish: () => {
            setLastCompletionLength(0);
            setStreamInsertPos(null);
            toast.success('AI completion finished');
        }
    });

    const editor = useEditor((root) => {
        const e = Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, content);
                ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
                    if (markdown !== prevMarkdown) {
                        onChange(markdown);
                    }
                });
            })
            .config(nord)
            .use(commonmark)
            .use(gfm)
            .use(listener);

        setEditorInstance(e);
        return e;
    }, [content]);

    // Update editor with AI completion result (Streaming effect)
    useEffect(() => {
        if (completion && editorInstance && isLoading && streamInsertPos !== null) {
            const addedText = completion.slice(lastCompletionLength);
            if (addedText) {
                editorInstance.action((ctx) => {
                    const view = ctx.get(editorViewCtx);
                    const { state, dispatch } = view;
                    const tr = state.tr.insertText(addedText, streamInsertPos);
                    dispatch(tr);
                    setStreamInsertPos(streamInsertPos + addedText.length);
                });
                setLastCompletionLength(completion.length);
            }
        }
    }, [completion, editorInstance, isLoading, lastCompletionLength, streamInsertPos]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                toast.success('Note saved (Autosave enabled)');
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                handleAIComplete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editorInstance]);

    const handleAIComplete = async () => {
        if (isLoading) return;
        const view = editorInstance?.action((ctx) => ctx.get(editorViewCtx));
        if (!view) return;

        const { state } = view;
        const textBefore = state.doc.textBetween(Math.max(0, state.selection.from - 500), state.selection.from, '\n');

        setLastCompletionLength(0);
        await complete('', { body: { context: textBefore } });
    };

    const handleAIAction = async (type: 'summarize' | 'improve') => {
        const view = editorInstance?.action((ctx) => ctx.get(editorViewCtx));
        if (!view) return;

        const { state } = view;
        const selection = state.doc.textBetween(state.selection.from, state.selection.to, '\n');
        const contentToProcess = selection || state.doc.textContent;

        const res = await fetch('/api/ai/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: contentToProcess, type: type === 'summarize' ? 'summarize' : 'improve' }),
        });

        if (res.ok) {
            const { result } = await res.json();
            editorInstance?.action((ctx) => {
                const view = ctx.get(editorViewCtx);
                const { state, dispatch } = view;
                const tr = selection
                    ? state.tr.replaceWith(state.selection.from, state.selection.to, state.schema.text(result))
                    : state.tr.replaceWith(0, state.doc.content.size, state.schema.text(result));
                dispatch(tr);
            });
        }
    };

    return (
        <div className="relative group">
            <div className="absolute right-4 -top-12 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm z-10">
                <button
                    onClick={handleAIComplete}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400"
                    title="Continue Writing (Cmd+Shift+A)"
                >
                    <Sparkles className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleAIAction('summarize')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-purple-600 dark:text-purple-400"
                    title="Summarize"
                >
                    <Wand2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleAIAction('improve')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-green-600 dark:text-green-400"
                    title="Improve Writing"
                >
                    <Type className="w-4 h-4" />
                </button>
            </div>
            <Milkdown />
            {isLoading && (
                <div className="absolute bottom-4 right-4 text-xs text-gray-400 animate-pulse">
                    AI is writing...
                </div>
            )}
        </div>
    );
};

const MilkdownEditor: React.FC<EditorProps> = (props) => (
    <MilkdownProvider>
        <EditorImpl {...props} />
    </MilkdownProvider>
);

export default MilkdownEditor;
