'use client';

import React from 'react';
import { Milkdown, useEditor, MilkdownProvider } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

const EditorImpl: React.FC<EditorProps> = ({ content, onChange }) => {
    useEditor((root) => {
        return Editor.make()
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
    }, [content, onChange]);

    return <Milkdown />;
};

const MilkdownEditor: React.FC<EditorProps> = (props) => (
    <MilkdownProvider>
        <EditorImpl {...props} />
    </MilkdownProvider>
);

export default MilkdownEditor;
