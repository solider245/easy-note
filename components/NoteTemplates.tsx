'use client';

import { X } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    emoji: string;
    description: string;
    title: string;
    content: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'meeting',
        name: 'Meeting Notes',
        emoji: '📋',
        description: 'Agenda, attendees, action items',
        title: 'Meeting Notes — ' + new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        content: `## Meeting Notes

**Date:** ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Attendees:** 

---

## Agenda

1. 
2. 
3. 

## Discussion

### Topic 1


### Topic 2


## Action Items

- [ ] @person — task — due date
- [ ] @person — task — due date

## Next Meeting

**Date:** 
**Topics:** 
`,
    },
    {
        id: 'todo',
        name: 'To-Do List',
        emoji: '✅',
        description: 'Tasks with priorities',
        title: 'To-Do — ' + new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        content: `## To-Do List

### 🔴 High Priority
- [ ] 
- [ ] 

### 🟡 Medium Priority
- [ ] 
- [ ] 

### 🟢 Low Priority
- [ ] 
- [ ] 

---

### ✅ Done
`,
    },
    {
        id: 'journal',
        name: 'Daily Journal',
        emoji: '📔',
        description: 'Reflection, gratitude, goals',
        title: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        content: `## ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

### 🌅 Morning Intentions

What do I want to accomplish today?

1. 
2. 
3. 

### 📝 Notes & Thoughts


### 🙏 Gratitude

Today I'm grateful for:

- 
- 
- 

### 🌙 Evening Reflection

What went well?


What could be better?


### 💡 Ideas & Insights

`,
    },
    {
        id: 'project',
        name: 'Project Brief',
        emoji: '🚀',
        description: 'Goals, scope, timeline',
        title: 'Project: ',
        content: `## Project Brief

### Overview

**Project Name:** 
**Owner:** 
**Start Date:** 
**Target Date:** 

---

### Goals

What does success look like?

1. 
2. 
3. 

### Scope

**In scope:**
- 

**Out of scope:**
- 

### Milestones

| Milestone | Due Date | Status |
|-----------|----------|--------|
|  |  | 🔵 Not started |
|  |  | 🔵 Not started |

### Resources & Links

- 

### Notes

`,
    },
    {
        id: 'research',
        name: 'Research Notes',
        emoji: '🔬',
        description: 'Sources, findings, analysis',
        title: 'Research: ',
        content: `## Research Notes

**Topic:** 
**Date:** ${new Date().toLocaleDateString()}

---

## Key Questions

1. 
2. 
3. 

## Sources

### Source 1
- **URL/Reference:** 
- **Key Points:**
  - 

### Source 2
- **URL/Reference:** 
- **Key Points:**
  - 

## Findings & Analysis


## Conclusions


## Further Reading

- 
`,
    },
    {
        id: 'blank',
        name: 'Blank Note',
        emoji: '📄',
        description: 'Start from scratch',
        title: 'New Note',
        content: '',
    },
];

interface NoteTemplatesProps {
    onSelect: (title: string, content: string) => void;
    onClose: () => void;
}

export default function NoteTemplates({ onSelect, onClose }: NoteTemplatesProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Choose a Template</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Start with a pre-built structure</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Templates grid */}
                <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                    {TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => { onSelect(template.title, template.content); onClose(); }}
                            className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-left group"
                        >
                            <span className="text-2xl flex-shrink-0 mt-0.5">{template.emoji}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {template.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                    {template.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-[11px] text-gray-400">Press <kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">ESC</kbd> to cancel</p>
                </div>
            </div>
        </div>
    );
}
