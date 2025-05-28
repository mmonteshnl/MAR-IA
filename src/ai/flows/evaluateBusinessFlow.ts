'use server';
/**
 * @fileOverview Flujo para evaluar las características de un negocio.
 *
 * - evaluateBusinessFeatures - Función que realiza la evaluación.
 * - EvaluateBusinessInput - Tipo de entrada para evaluateBusinessFeatures.
 * - EvaluateBusinessOutput - Tipo de salida para evaluateBusinessFeatures.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateBusinessInputSchema = z.object({
  leadName: z.string().describe('El nombre del negocio.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  address: z.string().optional().describe('La dirección del negocio.'),
  website: z.string().optional().describe('El sitio web del negocio.'),
  // Se podría añadir un campo para que el usuario especifique en qué áreas enfocar la evaluación
  // userFocus: z.string().optional().describe('Áreas específicas en las que el usuario quiere enfocar la evaluación.')
});
export type EvaluateBusinessInput = z.infer<typeof EvaluateBusinessInputSchema>;

const EvaluateBusinessOutputSchema = z.object({
  evaluation: z.string().describe('Un resumen de la evaluación del negocio, destacando posibles puntos fuertes y áreas de oportunidad, especialmente en relación con la adopción de tecnologías o servicios digitales.'),
});
export type EvaluateBusinessOutput = z.infer<typeof EvaluateBusinessOutputSchema>;

export async function evaluateBusinessFeatures(input: EvaluateBusinessInput): Promise<EvaluateBusinessOutput> {
  return evaluateBusinessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateBusinessPrompt',
  input: {schema: EvaluateBusinessInputSchema},
  output: {schema: EvaluateBusinessOutputSchema},
  prompt: `Eres un analista de negocios especializado en identificar oportunidades para empresas a través de la tecnología y servicios digitales. Tu tarea es proporcionar una breve evaluación del negocio "{{leadName}}".

Información disponible del negocio:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo: {{{businessType}}}{{/if}}
{{#if address}}- Dirección: {{{address}}}{{/if}}
{{#if website}}- Sitio Web: {{{website}}}{{/if}}

Basándote en esta información (y en conocimiento general si es un tipo de negocio común):
1.  Identifica 1-2 posibles puntos fuertes del negocio.
2.  Identifica 1-2 áreas donde podrían beneficiarse de mejoras tecnológicas, digitalización o nuevos servicios (ej. marketing digital, optimización de procesos, presencia online, herramientas de gestión, etc.).
3.  Sé conciso y directo. El resultado debe ser un texto breve y fácil de entender.

Formato de la evaluación:
Puntos Fuertes:
- [Punto fuerte 1]
- [Punto fuerte 2 (si aplica)]

Áreas de Oportunidad (Tecnología/Digital):
- [Oportunidad 1 con breve descripción]
- [Oportunidad 2 con breve descripción (si aplica)]

Genera solo la evaluación.`,
});

export const evaluateBusinessFlow = ai.defineFlow(
  {
    name: 'evaluateBusinessFlow',
    inputSchema: EvaluateBusinessInputSchema,
    outputSchema: EvaluateBusinessOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar la evaluación del negocio.');
    }
    return output;
  }
);
