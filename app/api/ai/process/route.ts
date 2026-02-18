import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { configService } from '@/lib/config/config-service';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const { content, type } = await req.json();

    const apiKey = await configService.get('OPENAI_API_KEY');
    const modelName = await configService.get('OPENAI_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 400 });
    }

    const openai = createOpenAI({ apiKey });

    if (type === 'summarize') {
        const { text } = await generateText({
            model: openai(modelName) as any,
            system: 'You are a helpful writing assistant. Summarize the provided Markdown text concisely.',
            prompt: content,
        });
        return NextResponse.json({ result: text });
    } else if (type === 'suggest-title') {
        const { text } = await generateText({
            model: openai(modelName) as any,
            system: 'You are a helpful writing assistant. Suggest a short, catchy title for the provided Markdown content. Return ONLY the title.',
            prompt: content,
        });
        return NextResponse.json({ result: text });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
