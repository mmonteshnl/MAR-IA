'use server';
/**
 * @fileOverview Flujo para generar un mensaje de bienvenida para un nuevo lead.
 *
 * - generateWelcomeMessage - Función que genera el mensaje de bienvenida.
 * - WelcomeMessageInput - Tipo de entrada para generateWelcomeMessage.
 * - WelcomeMessageOutput - Tipo de salida para generateWelcomeMessage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeMessageInputSchema = z.object({
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio (ej: restaurante, software, etc.).'),
});
export type WelcomeMessageInput = z.infer<typeof WelcomeMessageInputSchema>;

const WelcomeMessageOutputSchema = z.object({
  message: z.string().describe('El mensaje de bienvenida generado.'),
});
export type WelcomeMessageOutput = z.infer<typeof WelcomeMessageOutputSchema>;

export async function generateWelcomeMessage(input: WelcomeMessageInput): Promise<WelcomeMessageOutput> {
  return welcomeMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'welcomeMessagePrompt',
  input: {schema: WelcomeMessageInputSchema},
  output: {schema: WelcomeMessageOutputSchema},
  prompt: `Eres un asistente de ventas amigable y profesional. Tu tarea es redactar un mensaje de bienvenida corto y personalizado para un nuevo lead.

Nombre del Lead: {{{leadName}}}
{{#if businessType}}
Tipo de Negocio: {{{businessType}}}
{{/if}}

Considera lo siguiente para el mensaje:
- Sé cordial y entusiasta.
- Menciona el nombre del lead.
- Si se proporciona el tipo de negocio, puedes hacer una referencia sutil a él.
- El objetivo es iniciar una conversación y mostrar interés genuino en explorar cómo tus servicios/productos podrían ayudarle.
- Evita ser demasiado genérico o insistente.
- Mantén el mensaje breve, ideal para un primer contacto (email corto o mensaje directo).

Genera solo el cuerpo del mensaje.`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    inputSchema: WelcomeMessageInputSchema,
    outputSchema: WelcomeMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el mensaje de bienvenida.');
    }
    return output;
  }
);
