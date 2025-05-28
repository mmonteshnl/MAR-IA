'use server';
/**
 * @fileOverview Flujo para generar guías de manejo de objeciones.
 *
 * - generateObjectionHandlingGuidance - Función que genera la guía de manejo de objeciones.
 * - GenerateObjectionHandlingGuidanceInput - Tipo de entrada para generateObjectionHandlingGuidance.
 * - GenerateObjectionHandlingGuidanceOutput - Tipo de salida para generateObjectionHandlingGuidance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateObjectionHandlingGuidanceInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  objectionRaised: z.string().describe('La objeción específica planteada por el lead (ej. "Es muy caro", "No tenemos tiempo ahora", "Ya usamos a X").'),
  productInDiscussion: z.object({
    name: z.string(),
    description: z.string(),
    price_usd: z.string()
  }).optional().describe('El producto/servicio específico sobre el que se planteó la objeción.'),
  stageInSalesProcess: z.string().optional().describe('Etapa del proceso de ventas cuando surgió la objeción.'),
});
export type GenerateObjectionHandlingGuidanceInput = z.infer<typeof GenerateObjectionHandlingGuidanceInputSchema>;

const GenerateObjectionHandlingGuidanceOutputSchema = z.object({
  objectionCategory: z.string().describe('Categoría de la objeción (ej. Precio, Tiempo, Competencia, Necesidad).'),
  empathyStatement: z.string().describe('Una frase inicial para mostrar empatía y validar la preocupación del lead.'),
  suggestedResponses: z.array(
    z.object({
      strategyName: z.string().describe('Nombre de la estrategia de respuesta (ej. Reencuadre de Valor, Aclaración de Alcance, Comparación Diferencial, Historia de Éxito).'),
      responsePoints: z.array(z.string()).describe('Puntos clave o frases para articular la respuesta.'),
      pros: z.array(z.string()).optional().describe('Ventajas de esta estrategia.'),
      consOrWatchouts: z.array(z.string()).optional().describe('Posibles desventajas o puntos a tener cuidado con esta estrategia.')
    })
  ).min(1).max(3).describe('De 1 a 3 estrategias de respuesta sugeridas con sus puntos clave.'),
  clarifyingQuestions: z.array(z.string()).optional().describe('Preguntas que el comercial podría hacer para entender mejor la raíz de la objeción antes de responder directamente.')
});
export type GenerateObjectionHandlingGuidanceOutput = z.infer<typeof GenerateObjectionHandlingGuidanceOutputSchema>;

export async function generateObjectionHandlingGuidance(input: GenerateObjectionHandlingGuidanceInput): Promise<GenerateObjectionHandlingGuidanceOutput> {
  return generateObjectionHandlingGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateObjectionHandlingGuidancePrompt',
  input: {schema: GenerateObjectionHandlingGuidanceInputSchema},
  output: {schema: GenerateObjectionHandlingGuidanceOutputSchema},
  prompt: `Eres un coach de ventas de élite, especializado en superar objeciones complejas en entornos B2B. Un comercial necesita tu ayuda para responder a una objeción planteada por el lead "{{leadName}}".

Información del Contexto:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
- Objeción Planteada por el Lead: "{{{objectionRaised}}}"
{{#if productInDiscussion}}
- Producto/Servicio en Discusión:
  - Nombre: {{{productInDiscussion.name}}}
  - Descripción: {{{productInDiscussion.description}}}
  - Precio: {{{productInDiscussion.price_usd}}}
{{/if}}
{{#if stageInSalesProcess}}- Etapa del Proceso de Ventas: {{{stageInSalesProcess}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales sobre el Lead: {{{leadNotes}}}{{/if}}

Tu tarea es proporcionar una guía completa para manejar esta objeción:
1.  **Categorizar la Objeción:** Identifica la categoría principal de la objeción (ej. Precio, Falta de Necesidad Percibida, Competencia, Tiempo/Urgencia, Autoridad, etc.).
2.  **Declaración de Empatía:** Redacta una frase inicial que el comercial pueda usar para reconocer la objeción del lead y mostrar comprensión, sin necesariamente estar de acuerdo.
3.  **Estrategias de Respuesta Sugeridas (1-3 opciones):**
    *   Para cada estrategia:
        *   Dale un nombre descriptivo (ej. "Reencuadrar el Precio como Inversión", "Demostrar ROI", "Aislamiento de la Objeción", "Boomerang").
        *   Detalla los puntos clave o frases que el comercial puede usar. Estos deben ser específicos y, si es posible, cuantificables.
        *   Opcionalmente, menciona brevemente las ventajas de usar esa estrategia y cualquier consideración o "cuidado con".
    *   Las respuestas deben ser constructivas, buscando educar al lead o cambiar su perspectiva, en lugar de ser defensivas.
4.  **Preguntas de Aclaración (Opcional):** Sugiere 1-2 preguntas inteligentes que el comercial podría hacer ANTES de responder, para asegurarse de que entiende completamente la preocupación del lead.

Considera la naturaleza específica de "{{{objectionRaised}}}". Adapta tus respuestas al producto/servicio {{{productInDiscussion.name}}} si se especifica.
El objetivo es equipar al comercial con herramientas para convertir la objeción en una oportunidad de diálogo y avance.

Genera la respuesta en el formato JSON especificado.`,
});

const generateObjectionHandlingGuidanceFlow = ai.defineFlow(
  {
    name: 'generateObjectionHandlingGuidanceFlow',
    inputSchema: GenerateObjectionHandlingGuidanceInputSchema,
    outputSchema: GenerateObjectionHandlingGuidanceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudieron generar las guías de manejo de objeciones.');
    }
    return output;
  }
);