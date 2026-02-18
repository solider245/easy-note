import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const { prompt, context } = await req.json();

    const result = streamText({
        model: openai('gpt-4o-mini') as any,
        system: `You are a helpful writing assistant. 
    The user is writing a note in Markdown format. 
    Context from previous lines: ${context}
    Continue the text naturally and keep the style consistent. 
    Return ONLY the continuation text, no commentary.`,
        prompt: prompt,
    });

    return result.toTextStreamResponse();
}
