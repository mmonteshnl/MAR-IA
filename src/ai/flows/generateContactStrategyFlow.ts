'use server';
/**
 * @fileOverview Flujo para generar estrategias de contacto para leads.
 *
 * - generateContactStrategy - Función que genera las estrategias de contacto.
 * - GenerateContactStrategyInput - Tipo de entrada para generateContactStrategy.
 * - GenerateContactStrategyOutput - Tipo de salida para generateContactStrategy.
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

const GenerateContactStrategyInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadStage: z.string().optional().describe('Etapa actual del lead en el pipeline (ej. Nuevo, Calificado, Negociación).'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  contactObjective: z.string().optional().describe('Objetivo específico para este primer contacto, si el usuario lo define.'),
  userProducts: z.array(ProductSchema).optional().describe('Lista de productos/servicios que ofrece el usuario.'),
});
export type GenerateContactStrategyInput = z.infer<typeof GenerateContactStrategyInputSchema>;

const GenerateContactStrategyOutputSchema = z.object({
  suggestedChannels: z.array(z.object({
    channel: z.string().describe('Canal de contacto sugerido (ej. Email, Llamada, WhatsApp, LinkedIn).'),
    reasoning: z.string().describe('Justificación breve para elegir este canal para este lead.'),
  })).min(1).max(2).describe('Uno o dos canales de contacto sugeridos con su justificación.'),
  keyTalkingPoints: z.array(z.string()).min(2).max(4).describe('Puntos clave (2-4) para mencionar en el primer contacto, enfocados en generar interés y valor.'),
  openingLineSuggestion: z.string().optional().describe('Sugerencia para una frase de apertura, adaptada al canal principal sugerido.'),
  primaryGoalOfContact: z.string().describe('Objetivo principal recomendado para este primer contacto (ej. Presentarse y agendar breve llamada, Compartir un recurso valioso, Entender un desafío clave).'),
});
export type GenerateContactStrategyOutput = z.infer<typeof GenerateContactStrategyOutputSchema>;

export async function generateContactStrategy(input: GenerateContactStrategyInput): Promise<GenerateContactStrategyOutput> {
  return generateContactStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContactStrategyPrompt',
  input: {schema: GenerateContactStrategyInputSchema},
  output: {schema: GenerateContactStrategyOutputSchema},
  prompt: `Eres un estratega de ventas B2B y comunicación altamente experimentado, especializado en el primer contacto con leads. Tu tarea es sugerir la mejor estrategia para el primer contacto con el lead "{{leadName}}".

Información disponible del lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
{{#if leadStage}}- Etapa Actual: {{{leadStage}}}{{/if}}
{{#if leadNotes}}- Notas Adicionales del Lead: {{{leadNotes}}}{{/if}}
{{#if contactObjective}}- Objetivo del Usuario para este Contacto: {{{contactObjective}}}{{/if}}

{{#if userProducts.length}}
Productos/Servicios que ofrece el usuario (para contextualizar el valor):
{{#each userProducts}}
- Nombre: {{this.name}}, Descripción: {{this.description}}
{{/each}}
{{/if}}

Basándote en esta información:
1.  **Canales Sugeridos:** Recomienda 1 o 2 canales principales más apropiados para el primer contacto con "{{{leadName}}}" (ej. Email, Llamada Telefónica, Mensaje de LinkedIn, WhatsApp si se tiene el número y es culturalmente aceptable). Justifica brevemente por qué cada canal es adecuado para este lead y su tipo de negocio.
2.  **Puntos Clave de Conversación:** Identifica de 2 a 4 puntos clave que se deberían mencionar para captar el interés del lead. Estos puntos deben conectar las posibles necesidades o desafíos del lead (inferidos de su tipo de negocio o notas) con el valor que los productos/servicios del usuario pueden ofrecer.
3.  **Sugerencia de Frase de Apertura (Opcional):** Para el canal principal sugerido, redacta una frase de apertura cortés, profesional y que invite a la conversación.
4.  **Objetivo Principal del Contacto:** Define claramente cuál debería ser el objetivo primordial de este primer contacto, considerando la información del lead y el objetivo del usuario si fue provisto. Por ejemplo: "Presentarse, establecer credibilidad y agendar una breve llamada de descubrimiento de 15 minutos." o "Compartir un caso de estudio relevante y medir el interés inicial."

Considera la etapa actual del lead. Si es "Nuevo", el enfoque será más introductorio y de creación de valor.
El resultado debe ser práctico y accionable para un profesional de ventas. Evita respuestas genéricas.

Genera la respuesta en el formato JSON especificado.`,
});

const generateContactStrategyFlow = ai.defineFlow(
  {
    name: 'generateContactStrategyFlow',
    inputSchema: GenerateContactStrategyInputSchema,
    outputSchema: GenerateContactStrategyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudieron generar las estrategias de contacto.');
    }
    return output;
  }
);