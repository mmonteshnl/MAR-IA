'use server';
/**
 * @fileOverview Flujo para generar mensajes recordatorios de seguimiento.
 *
 * - generateFollowUpReminderMessage - Función que genera el mensaje recordatorio.
 * - GenerateFollowUpReminderMessageInput - Tipo de entrada.
 * - GenerateFollowUpReminderMessageOutput - Tipo de salida.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFollowUpReminderMessageInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  reminderReason: z.string().describe('El motivo específico del recordatorio, ej. "Seguimiento post-demo", "Recordatorio de propuesta pendiente", "Reactivar conversación".'),
  previousCallToAction: z.string().optional().describe('La llamada a la acción de la comunicación anterior, si se recuerda.'),
  daysSinceLastContact: z.number().optional().describe('Número de días desde el último contacto.'),
});
export type GenerateFollowUpReminderMessageInput = z.infer<typeof GenerateFollowUpReminderMessageInputSchema>;

const GenerateFollowUpReminderMessageOutputSchema = z.object({
  reminderTypeSuggestion: z.string().describe('Tipo de recordatorio sugerido (ej. Email Corto, Mensaje Rápido de LinkedIn, Llamada Breve).'),
  messageSubjectOrTitle: z.string().optional().describe('Asunto para email/mensaje, o tema principal para una llamada.'),
  messageBodyOrScriptPoints: z.string().describe('Cuerpo del mensaje (si es email/texto) o puntos clave para un guion de llamada. Debe ser breve, amable y directo al punto.'),
  tone: z.string().describe('Tono recomendado para el mensaje (ej. Amable y servicial, Ligeramente urgente pero cortés, Entusiasta y proactivo).'),
});
export type GenerateFollowUpReminderMessageOutput = z.infer<typeof GenerateFollowUpReminderMessageOutputSchema>;

export async function generateFollowUpReminderMessage(input: GenerateFollowUpReminderMessageInput): Promise<GenerateFollowUpReminderMessageOutput> {
  return generateFollowUpReminderMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpReminderMessagePrompt',
  input: {schema: GenerateFollowUpReminderMessageInputSchema},
  output: {schema: GenerateFollowUpReminderMessageOutputSchema},
  prompt: `Eres un asistente de ventas virtual, experto en redactar recordatorios de seguimiento efectivos y que no resulten molestos. Tu tarea es generar un mensaje recordatorio para el lead "{{leadName}}".

Información disponible:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
- Motivo del Recordatorio (Contexto): "{{{reminderReason}}}"
{{#if previousCallToAction}}- Llamada a la Acción Anterior (si se recuerda): "{{{previousCallToAction}}}"{{/if}}
{{#if daysSinceLastContact}}- Días desde el último contacto: {{{daysSinceLastContact}}} días{{/if}}
{{#if leadNotes}}- Notas sobre el Lead: {{{leadNotes}}}{{/if}}

Instrucciones para el Mensaje Recordatorio:
1.  **Tipo de Recordatorio Sugerido:** Basado en el motivo y los días desde el último contacto, sugiere el canal más apropiado para este recordatorio (ej. un email corto, un mensaje rápido por LinkedIn, una llamada telefónica breve).
2.  **Asunto/Título (si aplica):** Si el canal es un email o mensaje, crea un asunto conciso y claro. Si es una llamada, un tema principal.
3.  **Cuerpo del Mensaje / Puntos Clave del Guion:**
    *   Redacta el mensaje o los puntos clave para la llamada.
    *   Debe ser BREVE y directo al grano.
    *   Debe hacer referencia amable al motivo del recordatorio ({{{reminderReason}}}).
    *   Si hubo una llamada a la acción previa ({{{previousCallToAction}}}), puede recordarla sutilmente.
    *   Debe proponer un siguiente paso fácil o reiterar el valor.
    *   Ejemplo: "Solo quería hacer un breve seguimiento sobre [motivo]. ¿Has tenido oportunidad de [CTA anterior]?" o "Recordando nuestra conversación sobre [tema], ¿sería un buen momento para [nuevo CTA simple]?".
4.  **Tono:** Define el tono apropiado. Generalmente, debe ser amable, servicial y respetuoso del tiempo del lead. Considera los días desde el último contacto para ajustar la "urgencia" (si aplica).

El objetivo principal es mantener el lead "caliente" y facilitar el avance sin ser insistente.
Evita frases como "Espero que estés bien" a menos que sea muy natural. Ve al grano.

Genera la respuesta en el formato JSON especificado.`,
});

const generateFollowUpReminderMessageFlow = ai.defineFlow(
  {
    name: 'generateFollowUpReminderMessageFlow',
    inputSchema: GenerateFollowUpReminderMessageInputSchema,
    outputSchema: GenerateFollowUpReminderMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el mensaje recordatorio de seguimiento.');
    }
    return output;
  }
);