import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { configService } from '@/lib/config/config-service';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const { prompt, context } = await req.json();

    const apiKey = await configService.get('OPENAI_API_KEY');
    const modelName = await configService.get('OPENAI_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
        return new Response('OpenAI API Key not configured', { status: 400 });
    }

    const openai = createOpenAI({ apiKey });

    const result = streamText({
        model: openai(modelName) as any,
        system: `You are a helpful writing assistant. 
    The user is writing a note in Markdown format. 
    Context from previous lines: ${context}
    Continue the text naturally and keep the style consistent. 
    Return ONLY the continuation text, no commentary.`,
        prompt: prompt,
    });

    return result.toTextStreamResponse();
}
