'use server';
/**
 * @fileOverview Flujo para generar mensajes de contraoferta.
 *
 * - generateCounterOfferMessage - Función que genera el mensaje de contraoferta.
 * - GenerateCounterOfferMessageInput - Tipo de entrada.
 * - GenerateCounterOfferMessageOutput - Tipo de salida.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCounterOfferMessageInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  leadOfferOrProposal: z.string().describe('La oferta o propuesta recibida del lead a la que se quiere contraofertar.'),
  desiredTermsForCounterOffer: z.string().describe('Los términos que el usuario desea en la contraoferta.'),
  justificationForCounterOffer: z.string().optional().describe('Breve justificación que el usuario quiere transmitir para su contraoferta.'),
});
export type GenerateCounterOfferMessageInput = z.infer<typeof GenerateCounterOfferMessageInputSchema>;

const GenerateCounterOfferMessageOutputSchema = z.object({
  subject: z.string().optional().describe('Asunto sugerido si la contraoferta se envía por email.'),
  openingStatement: z.string().describe('Frase de apertura que agradece la oferta del lead y introduce la contraoferta de manera profesional.'),
  counterOfferPoints: z.array(
    z.object({
      originalTerm: z.string().optional().describe('Término original de la oferta del lead que se modifica.'),
      proposedTerm: z.string().describe('Nuevo término propuesto en la contraoferta.'),
      briefRationale: z.string().optional().describe('Justificación muy breve para este cambio específico, si es necesario.')
    })
  ).min(1).describe('Puntos clave de la contraoferta, detallando los cambios.'),
  valuePropositionReinforcement: z.string().optional().describe('Una breve reafirmación del valor que el lead obtendría incluso con los términos de la contraoferta.'),
  callToAction: z.string().describe('Llamada a la acción clara, invitando a discutir la contraoferta (ej. "¿Estarías dispuesto/a a discutir estos puntos para encontrar un acuerdo mutuamente beneficioso?").'),
  tone: z.string().describe('Tono recomendado (ej. Firme pero colaborativo, Abierto a la discusión, Profesional y directo).'),
});
export type GenerateCounterOfferMessageOutput = z.infer<typeof GenerateCounterOfferMessageOutputSchema>;

export async function generateCounterOfferMessage(input: GenerateCounterOfferMessageInput): Promise<GenerateCounterOfferMessageOutput> {
  return generateCounterOfferMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCounterOfferMessagePrompt',
  input: {schema: GenerateCounterOfferMessageInputSchema},
  output: {schema: GenerateCounterOfferMessageOutputSchema},
  prompt: `Eres un especialista en redacción de comunicaciones de negociación, particularmente hábil en formular contraofertas B2B que son a la vez firmes y constructivas. Tu tarea es ayudar a redactar un mensaje (o los puntos clave para una conversación) para presentar una contraoferta al lead "{{leadName}}".

Contexto para la Contraoferta:
- Lead: {{{leadName}}}
- Oferta/Propuesta Recibida del Lead: "{{{leadOfferOrProposal}}}"
- Términos Deseados por el Usuario para la Contraoferta: "{{{desiredTermsForCounterOffer}}}"
{{#if justificationForCounterOffer}}- Justificación General del Usuario para la Contraoferta: "{{{justificationForCounterOffer}}}"{{/if}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
{{#if leadNotes}}- Notas sobre el Lead: {{{leadNotes}}}{{/if}}

Instrucciones para el Mensaje de Contraoferta:
1.  **Asunto (si es por email):** Corto, claro y que indique una respuesta a su propuesta.
2.  **Declaración de Apertura:** Comienza agradeciendo al lead por su oferta/propuesta. Introduce la contraoferta de manera profesional, indicando que se han considerado sus términos pero se proponen algunos ajustes.
3.  **Puntos Clave de la Contraoferta:**
    *   Presenta claramente los términos específicos que se están contraofertando (basados en {{{desiredTermsForCounterOffer}}}).
    *   Si es útil, menciona brevemente el término original de la oferta del lead que se está ajustando.
    *   Proporciona una justificación concisa para cada punto principal de la contraoferta, si {{{justificationForCounterOffer}}} aplica o si se puede inferir valor.
4.  **Refuerzo de la Propuesta de Valor (Opcional):** Recuerda brevemente el valor o los beneficios clave que el lead obtendrá al aceptar la solución, incluso con los términos de la contraoferta.
5.  **Llamada a la Acción:** Invita al lead a discutir la contraoferta. El objetivo es mantener la conversación abierta. Ejemplo: "¿Estarías abierto/a a una breve llamada para revisar estos ajustes y ver cómo podemos llegar a un acuerdo?".
6.  **Tono:** Define el tono. Generalmente, debe ser respetuoso, firme en los puntos clave, pero abierto a la negociación y colaborativo. Evita un tono confrontacional.

El mensaje debe ser claro, fácil de entender y enfocado en llegar a un acuerdo mutuamente aceptable si es posible, o al menos defender la posición del usuario de manera efectiva.

Genera la respuesta en el formato JSON especificado.`,
});

const generateCounterOfferMessageFlow = ai.defineFlow(
  {
    name: 'generateCounterOfferMessageFlow',
    inputSchema: GenerateCounterOfferMessageInputSchema,
    outputSchema: GenerateCounterOfferMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el mensaje de contraoferta.');
    }
    return output;
  }
);