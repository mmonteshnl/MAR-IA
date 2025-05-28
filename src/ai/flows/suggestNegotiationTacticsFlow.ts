'use server';
/**
 * @fileOverview Flujo para sugerir tácticas de negociación.
 *
 * - suggestNegotiationTactics - Función que sugiere tácticas de negociación.
 * - SuggestNegotiationTacticsInput - Tipo de entrada.
 * - SuggestNegotiationTacticsOutput - Tipo de salida.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNegotiationTacticsInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  negotiationContext: z.string().describe('Breve descripción del estado actual de la negociación, puntos de acuerdo y desacuerdo.'),
  dealValue: z.string().optional().describe('Valor aproximado del acuerdo en negociación.'),
  userLeveragePoints: z.array(z.string()).optional().describe('Puntos donde el usuario/comercial tiene ventaja o valor único.'),
  leadPainPoints: z.array(z.string()).optional().describe('Puntos débiles o necesidades urgentes conocidas del lead.'),
});
export type SuggestNegotiationTacticsInput = z.infer<typeof SuggestNegotiationTacticsInputSchema>;

const SuggestNegotiationTacticsOutputSchema = z.object({
  primaryNegotiationGoal: z.string().describe('Objetivo principal recomendado para la siguiente fase de negociación (ej. Cerrar en estos términos, Obtener una concesión X, Asegurar compromiso Y).'),
  suggestedTactics: z.array(
    z.object({
      tacticName: z.string().describe('Nombre de la táctica de negociación (ej. "Anclaje", "Concesión Estratégica", "Principio de Escasez", "Enfoque en Valor a Largo Plazo", "Si... Entonces...").'),
      description: z.string().describe('Breve explicación de la táctica y cómo aplicarla en este contexto específico.'),
      examplePhrasing: z.string().optional().describe('Una frase de ejemplo que el comercial podría usar para implementar la táctica.'),
      potentialRisksOrConsiderations: z.string().optional().describe('Riesgos o consideraciones al usar esta táctica.')
    })
  ).min(1).max(3).describe('De 1 a 3 tácticas de negociación específicas y aplicables.'),
  keyPreparationPoints: z.array(z.string()).optional().describe('Puntos clave que el comercial debería preparar o investigar antes de la siguiente interacción de negociación.')
});
export type SuggestNegotiationTacticsOutput = z.infer<typeof SuggestNegotiationTacticsOutputSchema>;

export async function suggestNegotiationTactics(input: SuggestNegotiationTacticsInput): Promise<SuggestNegotiationTacticsOutput> {
  return suggestNegotiationTacticsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNegotiationTacticsPrompt',
  input: {schema: SuggestNegotiationTacticsInputSchema},
  output: {schema: SuggestNegotiationTacticsOutputSchema},
  prompt: `Eres un maestro negociador con décadas de experiencia cerrando acuerdos B2B complejos. Un comercial necesita tu consejo sobre qué tácticas emplear en la negociación actual con el lead "{{leadName}}".

Contexto de la Negociación:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
- Estado Actual de la Negociación: "{{{negotiationContext}}}"
{{#if dealValue}}- Valor Aproximado del Acuerdo: {{{dealValue}}}{{/if}}
{{#if userLeveragePoints.length}}
- Puntos de Ventaja del Usuario/Comercial:
{{#each userLeveragePoints}}
  - {{{this}}}
{{/each}}
{{/if}}
{{#if leadPainPoints.length}}
- Puntos Débiles / Necesidades Urgentes del Lead:
{{#each leadPainPoints}}
  - {{{this}}}
{{/each}}
{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Tu misión es sugerir tácticas de negociación efectivas:
1.  **Objetivo Primario de Negociación:** Basado en el contexto, define cuál debería ser el objetivo principal del comercial para la siguiente ronda de negociación.
2.  **Tácticas Sugeridas (1-3 opciones):**
    *   Propón tácticas específicas (ej. "Anclaje de Precio Alto y Concesiones Menores", "Highlight de Pérdida por Inacción", "Técnica del 'Nibbling' para extras", "Argumento Basado en Valor, no en Precio").
    *   Para cada táctica:
        *   Explica brevemente cómo funciona y por qué sería adecuada en esta situación, considerando los puntos de ventaja del usuario y los puntos débiles del lead.
        *   Proporciona un ejemplo de fraseo que el comercial podría usar.
        *   Menciona brevemente los riesgos o cuándo NO usar esa táctica.
3.  **Puntos Clave de Preparación (Opcional):** Enumera 2-3 cosas que el comercial debería investigar, preparar o tener claras antes de la próxima conversación de negociación.

El enfoque debe ser ético y buscar un resultado ganar-ganar si es posible, pero con una clara orientación a alcanzar los objetivos del comercial.
Las tácticas deben ser prácticas y adaptadas al {{{negotiationContext}}}.

Genera la respuesta en el formato JSON especificado.`,
});

const suggestNegotiationTacticsFlow = ai.defineFlow(
  {
    name: 'suggestNegotiationTacticsFlow',
    inputSchema: SuggestNegotiationTacticsInputSchema,
    outputSchema: SuggestNegotiationTacticsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudieron generar las tácticas de negociación.');
    }
    return output;
  }
);