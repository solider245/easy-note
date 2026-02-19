import { Metadata } from 'next';

interface SharedNote {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
    tags: string[];
}

async function getSharedNote(token: string): Promise<SharedNote | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
    const { token } = await params;
    const note = await getSharedNote(token);
    return {
        title: note ? `${note.title} — Easy Note` : 'Note Not Found — Easy Note',
        description: note ? `Shared note: ${note.title}` : 'This note is not available.',
    };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const note = await getSharedNote(token);

    if (!note) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Note Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        This note may have been deleted or sharing has been disabled.
                    </p>
                </div>
            </div>
        );
    }

    const updatedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Easy Note</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">· Shared Note</span>
                    </div>
                    <a
                        href="/"
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                        Create your own →
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                <article>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                        {note.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Updated {updatedDate}
                        </span>
                        {note.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {note.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rendered markdown - using pre for now, could add a markdown renderer */}
                    <div className="prose dark:prose-invert max-w-none">
                        <SharedContent content={note.content} />
                    </div>
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-6">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Shared via{' '}
                        <a href="/" className="text-blue-500 hover:underline">Easy Note</a>
                        {' '}· A simple, fast note-taking app
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Simple markdown-to-HTML renderer for server component
function SharedContent({ content }: { content: string }) {
    // Render as preformatted text with basic styling
    // In production you'd use a proper markdown renderer
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>);
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-bold mt-5 mb-2">{line.slice(3)}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>);
        } else if (line.startsWith('> ')) {
            elements.push(
                <blockquote key={i} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-3">
                    {line.slice(2)}
                </blockquote>
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            elements.push(<li key={i} className="ml-4 list-disc">{line.slice(2)}</li>);
        } else if (line.match(/^\d+\. /)) {
            elements.push(<li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
        } else if (line.startsWith('```')) {
            // Code block - collect until closing ```
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono">
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
        } else if (line === '') {
            elements.push(<br key={i} />);
        } else {
            // Inline formatting: bold, italic, code
            const formatted = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono">$1</code>');
            elements.push(
                <p key={i} className="my-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted }}
                />
            );
        }
        i++;
    }

    return <div>{elements}</div>;
}
