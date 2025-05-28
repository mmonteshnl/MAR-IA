import type { NextRequest } from 'next/server';
// Import the function that evaluates the business flow (adjust the import if needed)
import { EvaluateBusinessOutput, evaluateBusinessFlow } from '@/ai/flows/evaluateBusinessFlow';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const response = await evaluateBusinessOutput(requestData);
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
async function evaluateBusinessOutput(requestData: any): Promise<EvaluateBusinessOutput> {
    // Here we assume requestData contains the necessary input for the business evaluation flow.
    // You may want to validate or transform requestData as needed.
    // Call the actual business evaluation logic (imported from your ai/flows module).
    return await evaluateBusinessFlow(requestData);
}

