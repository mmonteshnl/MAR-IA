
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// WARNING: Hardcoding API keys in source code is a security risk.
// It's strongly recommended to use environment variables (e.g., GOOGLE_API_KEY) instead.
const apiKey = "AIzaSyDt6BjWvj63ZB5VO1jyjzUcqXEvLN1Ex7s";

export const ai = genkit({
  plugins: [googleAI(apiKey ? { apiKey } : undefined)],
  model: 'googleai/gemini-2.0-flash',
});

