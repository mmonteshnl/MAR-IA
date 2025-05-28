import type { NextRequest } from 'next/server';
import { generateContactStrategy } from '@/ai/flows/generateContactStrategyFlow';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const response = await generateContactStrategy(requestData);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
