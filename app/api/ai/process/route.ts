import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const { content, type } = await req.json();

    if (type === 'summarize') {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: 'You are a helpful writing assistant. Summarize the provided Markdown text concisely.',
            prompt: content,
        });
        return NextResponse.json({ result: text });
    } else if (type === 'suggest-title') {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: 'You are a helpful writing assistant. Suggest a short, catchy title for the provided Markdown content. Return ONLY the title.',
            prompt: content,
        });
        return NextResponse.json({ result: text });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
