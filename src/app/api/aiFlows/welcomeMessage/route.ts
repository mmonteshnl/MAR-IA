import type { NextRequest } from 'next/server';
import { welcomeMessageFlow } from '@/ai/flows/welcomeMessageFlow';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    // Call the welcomeMessageFlow with the request data
    const response = await welcomeMessageFlow(requestData);
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
