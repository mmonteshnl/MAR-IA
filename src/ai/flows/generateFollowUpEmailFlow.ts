'use server';
/**
 * @fileOverview Flujo para generar emails de seguimiento personalizados.
 *
 * - generateFollowUpEmail - Función que genera el email de seguimiento.
 * - GenerateFollowUpEmailInput - Tipo de entrada para generateFollowUpEmail.
 * - GenerateFollowUpEmailOutput - Tipo de salida para generateFollowUpEmail.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSchema = z.object({
  name: z.string().describe('El nombre del producto o servicio.'),
  category: z.string().describe('La categoría del producto (ej: software, hardware).'),
  price_usd: z.string().describe('El precio del producto en USD.'),
  original_price_usd: z.string().optional().describe('El precio original en USD, si aplica (ej: para descuentos).'),
  description: z.string().optional().describe('La descripción detallada del producto o servicio.'),
});

const GenerateFollowUpEmailInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  previousContextSummary: z.string().describe('Resumen de la interacción previa o el punto clave que motiva este seguimiento.'),
  desiredOutcome: z.string().optional().describe('¿Qué espera lograr el usuario con este email de seguimiento (ej. Agendar demo, Obtener respuesta a pregunta X, Compartir recurso Y)?'),
  senderName: z.string().describe('Nombre del comercial que envía el email.'),
  senderCompany: z.string().describe('Nombre de la empresa del comercial.'),
  userProducts: z.array(ProductSchema).optional().describe('Lista de productos/servicios que ofrece el usuario.'),
});
export type GenerateFollowUpEmailInput = z.infer<typeof GenerateFollowUpEmailInputSchema>;

const GenerateFollowUpEmailOutputSchema = z.object({
  subject: z.string().describe('Asunto conciso, personalizado y atractivo para el correo de seguimiento.'),
  body: z.string().describe('Cuerpo completo del correo de seguimiento en texto plano, listo para ser adaptado y enviado. Debe incluir saludo, referencia al contexto, valor, CTA y firma.'),
  customizationPoints: z.array(z.string()).optional().describe('Lista de 2-3 sugerencias específicas sobre cómo el comercial podría personalizar aún más el email antes de enviarlo (ej. "Menciona un logro reciente de su empresa si lo conoces", "Adapta la CTA si tienes una oferta específica este mes").'),
});
export type GenerateFollowUpEmailOutput = z.infer<typeof GenerateFollowUpEmailOutputSchema>;

export async function generateFollowUpEmail(input: GenerateFollowUpEmailInput): Promise<GenerateFollowUpEmailOutput> {
  return generateFollowUpEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpEmailPrompt',
  input: {schema: GenerateFollowUpEmailInputSchema},
  output: {schema: GenerateFollowUpEmailOutputSchema},
  prompt: `Eres un experto en redacción de correos de ventas B2B, especializado en crear mensajes de seguimiento persuasivos, personalizados y que aportan valor. Tu tarea es generar una plantilla de correo electrónico de seguimiento para el lead "{{leadName}}".

Información disponible:
- Lead (Nombre del Contacto o Negocio): {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
- Resumen del Contexto Previo/Motivo del Seguimiento: {{{previousContextSummary}}}
{{#if desiredOutcome}}- Objetivo del Usuario para este Email: {{{desiredOutcome}}}{{/if}}
- Nombre del Remitente (Comercial): {{{senderName}}}
- Empresa del Remitente: {{{senderCompany}}}
{{#if userProducts.length}}
- Productos/Servicios del Usuario (para referencia de valor, no necesariamente para listarlos todos):
{{#each userProducts}}
  - {{this.name}}: {{this.description}} (Precio: {{this.price_usd}})
{{/each}}
{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Instrucciones para el Correo de Seguimiento:
1.  **Asunto:** Crea un asunto que sea breve, relevante para el {{{previousContextSummary}}}, y que incentive la apertura. Incluye el nombre del {{{leadName}}} si es natural.
2.  **Cuerpo del Correo (Texto Plano):**
    *   **Saludo:** Personalizado (ej. "Estimado/a [Nombre del Contacto en Lead],").
    *   **Referencia Concisa:** Recuerda brevemente la interacción o el tema anterior ({{{previousContextSummary}}}).
    *   **Aporte de Valor:** Este es el núcleo. No te limites a "solo quería hacer seguimiento". Ofrece algo nuevo o reitera un punto de valor clave. Puede ser:
        *   Un recurso útil (artículo, caso de estudio breve) relacionado con sus desafíos.
        *   Una nueva idea o perspectiva sobre cómo tus servicios/productos pueden ayudarles específicamente, basándote en {{{businessType}}} o {{{previousContextSummary}}}.
        *   Una respuesta a una pregunta pendiente o una aclaración.
    *   **Llamada a la Acción (CTA):** Clara, sencilla y de bajo compromiso. Si el {{{desiredOutcome}}} es específico, alinea la CTA con él. Ejemplos: "¿Te gustaría tener una charla de 15 minutos la próxima semana para explorar esto más a fondo?", "¿Hay alguna pregunta específica que pueda responderte ahora?", "Si esto te parece interesante, aquí tienes un enlace con más detalles: [Enlace]".
    *   **Cierre:** Profesional y cordial.
    *   **Firma:** {{{senderName}}}, {{{senderCompany}}}.
3.  **Tono:** Profesional, servicial, empático y centrado en las necesidades del lead. Evita la presión.
4.  **Puntos de Personalización (Opcional):** Incluye 2-3 sugerencias sobre cómo el comercial puede personalizar aún más el borrador antes de enviarlo para maximizar su impacto.

El objetivo es reenganchar al lead, aportar valor y facilitar el siguiente paso en la conversación.
Si el {{{desiredOutcome}}} es muy específico, asegúrate que el email se enfoque en alcanzarlo.

Genera la respuesta en el formato JSON especificado.`,
});

const generateFollowUpEmailFlow = ai.defineFlow(
  {
    name: 'generateFollowUpEmailFlow',
    inputSchema: GenerateFollowUpEmailInputSchema,
    outputSchema: GenerateFollowUpEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el email de seguimiento.');
    }
    return output;
  }
);