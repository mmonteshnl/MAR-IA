'use server';
/**
 * @fileOverview Flujo para desarrollar estrategias de negociación de alto nivel.
 *
 * - developNegotiationStrategy - Función que desarrolla la estrategia de negociación.
 * - DevelopNegotiationStrategyInput - Tipo de entrada.
 * - DevelopNegotiationStrategyOutput - Tipo de salida.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DevelopNegotiationStrategyInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  negotiationContext: z.string().describe('Breve descripción del estado actual de la negociación, puntos de acuerdo y desacuerdo.'),
  dealValue: z.string().optional().describe('Valor aproximado del acuerdo en negociación.'),
  userLeveragePoints: z.array(z.string()).optional().describe('Puntos donde el usuario/comercial tiene ventaja o valor único.'),
  leadPainPoints: z.array(z.string()).optional().describe('Puntos débiles o necesidades urgentes conocidas del lead.'),
  desiredRelationshipPostSale: z.string().optional().describe('Tipo de relación deseada con el cliente post-venta (ej. Transaccional, Socio a largo plazo).'),
});
export type DevelopNegotiationStrategyInput = z.infer<typeof DevelopNegotiationStrategyInputSchema>;

const DevelopNegotiationStrategyOutputSchema = z.object({
  overarchingStrategyName: z.string().describe('Nombre para la estrategia general de negociación (ej. "Colaborativa Basada en Valor", "Competitiva con Límite Claro", "Integrativa de Múltiples Puntos").'),
  strategyRationale: z.string().describe('Justificación de por qué esta estrategia general es la más adecuada para la situación actual y el tipo de lead.'),
  keyPillarsOfStrategy: z.array(
    z.object({
      pillarName: z.string().describe('Nombre del pilar o componente de la estrategia.'),
      description: z.string().describe('Descripción de este componente y cómo contribuye a la estrategia general.')
    })
  ).min(2).max(4).describe('Componentes principales de la estrategia.'),
  batnaSuggestion: z.string().optional().describe('Sugerencia sobre cómo definir o cuál podría ser la Mejor Alternativa a un Acuerdo Negociado (BATNA) para el comercial.'),
  walkAwayPointConsideration: z.string().optional().describe('Consideraciones para establecer el punto de retirada (walk-away point).'),
});
export type DevelopNegotiationStrategyOutput = z.infer<typeof DevelopNegotiationStrategyOutputSchema>;

export async function developNegotiationStrategy(input: DevelopNegotiationStrategyInput): Promise<DevelopNegotiationStrategyOutput> {
  return developNegotiationStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'developNegotiationStrategyPrompt',
  input: {schema: DevelopNegotiationStrategyInputSchema},
  output: {schema: DevelopNegotiationStrategyOutputSchema},
  prompt: `Eres un consultor estratégico de negociación B2B, enfocado en desarrollar planes de negociación de alto nivel. Un comercial busca tu ayuda para definir la estrategia general de negociación con el lead "{{leadName}}".

Contexto de la Negociación:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
- Estado Actual de la Negociación: "{{{negotiationContext}}}" (incluye puntos de acuerdo/desacuerdo)
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
{{#if desiredRelationshipPostSale}}- Relación Deseada Post-Venta: {{{desiredRelationshipPostSale}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Tu tarea es desarrollar una estrategia de negociación coherente:
1.  **Nombre de la Estrategia General:** Dale un nombre descriptivo a la estrategia general (ej. "Estrategia de Creación de Valor Conjunto", "Estrategia de Posicionamiento Firme con Flexibilidad Condicionada").
2.  **Justificación de la Estrategia:** Explica por qué esta estrategia general es la más apropiada, considerando el contexto, el tipo de lead, y la relación deseada post-venta.
3.  **Pilares Clave de la Estrategia (2-4 pilares):**
    *   Identifica los componentes fundamentales que sostendrán esta estrategia.
    *   Para cada pilar, describe su propósito y cómo se implementaría. Ejemplos de pilares: "Foco en beneficios a largo plazo sobre precio inmediato", "Identificación y apalancamiento de diferenciadores clave", "Construcción de confianza a través de transparencia selectiva", "Preparación de múltiples opciones y concesiones empaquetadas".
4.  **Sugerencia de BATNA (Mejor Alternativa a un Acuerdo Negociado):** Ofrece una idea o dirección sobre cómo el comercial debería pensar o cuál podría ser su BATNA en esta situación.
5.  **Consideración del Punto de Retirada:** Brinda una reflexión sobre los factores a considerar para establecer un punto de retirada claro.

La estrategia debe ser un marco guía para las acciones y tácticas específicas que el comercial empleará.
Debe ser realista y orientada a maximizar los resultados para el comercial, teniendo en cuenta la sostenibilidad de la relación si {{{desiredRelationshipPostSale}}} es importante.

Genera la respuesta en el formato JSON especificado.`,
});

const developNegotiationStrategyFlow = ai.defineFlow(
  {
    name: 'developNegotiationStrategyFlow',
    inputSchema: DevelopNegotiationStrategyInputSchema,
    outputSchema: DevelopNegotiationStrategyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo desarrollar la estrategia de negociación.');
    }
    return output;
  }
);