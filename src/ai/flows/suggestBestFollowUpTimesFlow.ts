'use server';
/**
 * @fileOverview Flujo para sugerir los mejores momentos para hacer seguimiento a leads.
 *
 * - suggestBestFollowUpTimes - Función que sugiere los mejores momentos.
 * - SuggestBestFollowUpTimesInput - Tipo de entrada para suggestBestFollowUpTimes.
 * - SuggestBestFollowUpTimesOutput - Tipo de salida para suggestBestFollowUpTimes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBestFollowUpTimesInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline (ej. Nuevo, Calificado, Negociación).'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  lastInteraction: z.object({
    date: z.string(),
    type: z.string(),
    summary: z.string()
  }).optional().describe('Información sobre la última interacción.'),
  leadTimeZone: z.string().optional().describe('Zona horaria del lead (ej. America/New_York, Europe/Madrid).'),
  countryCode: z.string().optional().describe('Código de país del lead (ej. US, ES, MX) para inferir cultura de negocios.'),
});
export type SuggestBestFollowUpTimesInput = z.infer<typeof SuggestBestFollowUpTimesInputSchema>;

const SuggestBestFollowUpTimesOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      dayOfWeek: z.string().describe('Día de la semana sugerido (ej. Martes, Jueves).'),
      timeSlotLocal: z.string().describe('Franja horaria sugerida en la hora local del lead (ej. 10:00 AM - 11:30 AM, 2:00 PM - 4:00 PM).'),
      reasoning: z.string().describe('Breve justificación de la sugerencia, considerando el tipo de negocio y prácticas comunes.')
    })
  ).min(1).max(3).describe('Lista de 1 a 3 sugerencias de momentos óptimos para el seguimiento.'),
  generalTips: z.array(z.string()).optional().describe('Consejos generales sobre el timing de seguimientos para este tipo de lead o su industria, incluyendo la frecuencia ideal de seguimiento si la última interacción fue reciente.')
});
export type SuggestBestFollowUpTimesOutput = z.infer<typeof SuggestBestFollowUpTimesOutputSchema>;

export async function suggestBestFollowUpTimes(input: SuggestBestFollowUpTimesInput): Promise<SuggestBestFollowUpTimesOutput> {
  return suggestBestFollowUpTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBestFollowUpTimesPrompt',
  input: {schema: SuggestBestFollowUpTimesInputSchema},
  output: {schema: SuggestBestFollowUpTimesOutputSchema},
  prompt: `Eres un experto en productividad de ventas y análisis del comportamiento del cliente B2B. Tu tarea es recomendar los mejores momentos para realizar un seguimiento efectivo al lead "{{leadName}}".

Información disponible del lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
{{#if leadStage}}- Etapa Actual: {{{leadStage}}}{{/if}}
{{#if lastInteraction}}
- Última Interacción:
  - Fecha: {{{lastInteraction.date}}}
  - Tipo: {{{lastInteraction.type}}}
  - Resumen: {{{lastInteraction.summary}}}
{{/if}}
{{#if leadTimeZone}}- Zona Horaria del Lead: {{{leadTimeZone}}}{{/if}}
{{#if countryCode}}- País del Lead: {{{countryCode}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales (pueden incluir preferencias o historial de contacto): {{{leadNotes}}}{{/if}}

Basándote en esta información y en conocimiento general sobre horarios productivos y cultura de negocios (considerando el país si se provee):
1.  **Sugerencias Específicas:** Proporciona de 1 a 3 sugerencias de días de la semana y franjas horarias específicas (en la hora local del lead, si se conoce su zona horaria) para el seguimiento.
2.  **Justificación:** Para cada sugerencia, explica brevemente por qué ese momento podría ser efectivo. Considera factores como: evitar picos de trabajo (lunes AM), momentos de menor distracción, o días donde se toman decisiones.
3.  **Consejos Generales (Opcional):**
    *   Si la última interacción fue reciente, sugiere un plazo o frecuencia de seguimiento apropiada antes de intentar estos "mejores momentos".
    *   Añade 1-2 consejos generales sobre el timing de seguimientos para leads del tipo "{{businessType}}" o de la industria/país si es relevante.

Evita ser demasiado prescriptivo si la información es limitada. Si no se conoce la zona horaria, indica que las sugerencias son en un horario laboral general y que se deben ajustar.
El objetivo es maximizar la probabilidad de una respuesta positiva.

Genera la respuesta en el formato JSON especificado.`,
});

const suggestBestFollowUpTimesFlow = ai.defineFlow(
  {
    name: 'suggestBestFollowUpTimesFlow',
    inputSchema: SuggestBestFollowUpTimesInputSchema,
    outputSchema: SuggestBestFollowUpTimesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudieron generar las sugerencias de mejores momentos para seguimiento.');
    }
    return output;
  }
);