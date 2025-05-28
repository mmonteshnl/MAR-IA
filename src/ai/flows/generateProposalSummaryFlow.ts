'use server';
/**
 * @fileOverview Flujo para generar resúmenes de propuestas comerciales.
 *
 * - generateProposalSummary - Función que genera el resumen de la propuesta.
 * - GenerateProposalSummaryInput - Tipo de entrada para generateProposalSummary.
 * - GenerateProposalSummaryOutput - Tipo de salida para generateProposalSummary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProposalSummaryInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  fullProposalDetails: z.object({
    problemStatement: z.string(),
    proposedSolution: z.string(),
    keyDeliverables: z.array(z.string()),
    pricingSummary: z.string(),
    callToAction: z.string()
  }).optional().describe('Objeto detallado con las secciones clave de la propuesta.'),
  targetAudienceForSummary: z.string().optional().describe('A quién va dirigido este resumen (ej. Decisor principal, Equipo técnico). Default: Decisor principal.'),
});
export type GenerateProposalSummaryInput = z.infer<typeof GenerateProposalSummaryInputSchema>;

const GenerateProposalSummaryOutputSchema = z.object({
  summaryTitle: z.string().describe('Un título conciso y atractivo para el resumen de la propuesta (ej. "Propuesta de Valor para [Lead Name]: Puntos Clave").'),
  executiveSummary: z.string().describe('Un resumen ejecutivo (3-5 frases) que capture la esencia de la propuesta: el problema del lead, la solución principal, y el impacto/valor clave.'),
  keyBenefitsAlignedWithNeeds: z.array(z.object({
    need: z.string().describe('Necesidad o desafío del lead que se aborda.'),
    benefit: z.string().describe('Beneficio específico de la propuesta que aborda esa necesidad.')
  })).min(2).max(4).describe('Lista de 2-4 beneficios clave, directamente alineados con las necesidades identificadas del lead.'),
  uniqueSellingPropositionHighlight: z.string().optional().describe('Un punto que destaque la propuesta de valor única (USP) o el diferenciador principal de la oferta.'),
  suggestedNextStepFromProposal: z.string().describe('El próximo paso claro y accionable que se espera del lead, tal como se indica en la propuesta original o una versión simplificada.')
});
export type GenerateProposalSummaryOutput = z.infer<typeof GenerateProposalSummaryOutputSchema>;

export async function generateProposalSummary(input: GenerateProposalSummaryInput): Promise<GenerateProposalSummaryOutput> {
  return generateProposalSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProposalSummaryPrompt',
  input: {schema: GenerateProposalSummaryInputSchema},
  output: {schema: GenerateProposalSummaryOutputSchema},
  prompt: `Eres un consultor de comunicación estratégica, experto en destilar información compleja de propuestas de venta B2B en resúmenes ejecutivos impactantes y fáciles de digerir. Tu tarea es generar un resumen claro y persuasivo de una propuesta para el lead "{{leadName}}".

Información de la Propuesta y el Lead:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
{{#if fullProposalDetails}}
- Detalles Clave de la Propuesta:
  - Problema del Cliente Abordado: {{{fullProposalDetails.problemStatement}}}
  - Solución Propuesta: {{{fullProposalDetails.proposedSolution}}}
  - Entregables Clave: {{{fullProposalDetails.keyDeliverables}}}
  - Resumen de Precios/Inversión: {{{fullProposalDetails.pricingSummary}}}
  - Llamada a la Acción de la Propuesta: {{{fullProposalDetails.callToAction}}}
{{else}}
  Por favor, proporciona al menos una descripción general de lo que se propuso.
{{/if}}
{{#if targetAudienceForSummary}}- Audiencia del Resumen: {{{targetAudienceForSummary}}}{{/if}}
{{#if leadNotes}}- Notas sobre el Lead (prioridades, preocupaciones): {{{leadNotes}}}{{/if}}

Instrucciones para el Resumen de la Propuesta:
1.  **Título del Resumen:** Crea un título que sea a la vez informativo y capte el interés del lead.
2.  **Resumen Ejecutivo:** Redacta un párrafo conciso (idealmente 3-5 frases) que articule:
    *   El principal desafío o necesidad del lead que la propuesta aborda.
    *   La esencia de la solución ofrecida.
    *   El resultado o valor más significativo que "{{{leadName}}}" obtendrá.
3.  **Beneficios Clave Alineados con Necesidades:** Identifica de 2 a 4 beneficios cruciales de la propuesta. Para cada uno, si es posible, vincula explícitamente el beneficio a una necesidad o problema conocido del lead (inferido de la información proporcionada).
4.  **Destaque de la Propuesta de Valor Única (USP) (Opcional):** Si la propuesta tiene un diferenciador claro o una USP fuerte, resáltalo brevemente.
5.  **Próximo Paso Sugerido:** Clarifica cuál es el siguiente paso que se espera del lead, idealmente tomado de la llamada a la acción de la propuesta original.

El tono debe ser profesional, confiado y centrado en el cliente. El resumen debe ser fácilmente escaneable y reforzar los puntos más importantes.
Adapta el lenguaje y el enfoque según la {{{targetAudienceForSummary}}} si se especifica (ej. más técnico para un equipo técnico, más estratégico/financiero para un decisor).
Si no se proporcionaron detalles completos de la propuesta, haz tu mejor esfuerzo para inferir y crear un resumen genérico pero útil basado en el {{{businessType}}} y cualquier nota.

Genera la respuesta en el formato JSON especificado.`,
});

const generateProposalSummaryFlow = ai.defineFlow(
  {
    name: 'generateProposalSummaryFlow',
    inputSchema: GenerateProposalSummaryInputSchema,
    outputSchema: GenerateProposalSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el resumen de la propuesta.');
    }
    return output;
  }
);