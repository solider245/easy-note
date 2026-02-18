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
import { replaceAll } from '@milkdown/utils';

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

const EditorImpl: React.FC<EditorProps> = ({ content, onChange }) => {
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const { complete, completion, isLoading } = useCompletion({
        api: '/api/ai/complete',
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

    // Update editor with AI completion result
    useEffect(() => {
        if (completion && editorInstance) {
            // This is a simplified way to append completion
            // Proper insertion would use prosemirror transaction
            // But since it's a stream, we might just want to wait for the end or append incrementally
        }
    }, [completion, editorInstance]);

    const handleAIComplete = async () => {
        const view = editorInstance?.action((ctx) => ctx.get(editorViewCtx));
        if (!view) return;

        const { state } = view;
        const textBefore = state.doc.textBetween(Math.max(0, state.selection.from - 500), state.selection.from, '\n');

        const result = await complete('', { body: { context: textBefore } });
        if (result && editorInstance) {
            // Append result to editor
            editorInstance.action((ctx) => {
                const view = ctx.get(editorViewCtx);
                const { state, dispatch } = view;
                const tr = state.tr.insertText(result, state.selection.to);
                dispatch(tr);
            });
        }
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
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400 title='Continue Writing'"
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
