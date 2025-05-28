'use server';
/**
 * @fileOverview Flujo para generar análisis de competidores.
 *
 * - generateCompetitorAnalysisInsights - Función que genera insights sobre competidores.
 * - GenerateCompetitorAnalysisInsightsInput - Tipo de entrada.
 * - GenerateCompetitorAnalysisInsightsOutput - Tipo de salida.
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

const GenerateCompetitorAnalysisInsightsInputSchema = z.object({
  leadId: z.string().describe('ID único del lead.'),
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  leadNotes: z.string().optional().describe('Notas generales existentes sobre el lead.'),
  knownCompetitors: z.array(z.string()).optional().describe('Nombres de competidores directos del lead, si el usuario los conoce.'),
  userProductForComparison: ProductSchema.optional().describe('El producto/servicio del usuario que se quiere posicionar frente a la competencia.'),
});
export type GenerateCompetitorAnalysisInsightsInput = z.infer<typeof GenerateCompetitorAnalysisInsightsInputSchema>;

const GenerateCompetitorAnalysisInsightsOutputSchema = z.object({
  leadBusinessFocus: z.string().optional().describe('Breve descripción del enfoque principal del negocio del lead, para contextualizar el análisis.'),
  potentialCompetitorTypes: z.array(z.string()).optional().describe('Tipos de competidores que el lead podría enfrentar si no se especifican competidores directos (ej. "Grandes cadenas vs. locales", "Proveedores online vs. físicos").'),
  comparativeDimensions: z.array(
    z.object({
      dimension: z.string().describe('Aspecto de comparación relevante (ej. Precio, Calidad del Producto, Servicio al Cliente, Innovación, Alcance de Mercado).'),
      userStrengthSuggestion: z.string().optional().describe('Cómo el producto/servicio del usuario podría destacarse o posicionarse en esta dimensión contra los competidores (generales o especificados).'),
      questionForLead: z.string().optional().describe('Una pregunta que el comercial podría hacerle al lead para entender mejor su percepción sobre esta dimensión respecto a sus competidores.')
    })
  ).min(2).max(4).describe('Dimensiones clave para comparar y cómo el usuario puede posicionarse.'),
  generalStrategyTip: z.string().optional().describe('Un consejo estratégico general para abordar la competencia al hablar con este lead.')
});
export type GenerateCompetitorAnalysisInsightsOutput = z.infer<typeof GenerateCompetitorAnalysisInsightsOutputSchema>;

export async function generateCompetitorAnalysisInsights(input: GenerateCompetitorAnalysisInsightsInput): Promise<GenerateCompetitorAnalysisInsightsOutput> {
  return generateCompetitorAnalysisInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCompetitorAnalysisInsightsPrompt',
  input: {schema: GenerateCompetitorAnalysisInsightsInputSchema},
  output: {schema: GenerateCompetitorAnalysisInsightsOutputSchema},
  prompt: `Eres un analista de mercado y estratega competitivo, con experiencia en ayudar a equipos de ventas a posicionar sus ofertas frente a la competencia. Tu tarea es generar ideas para un análisis comparativo con los competidores del lead "{{leadName}}", que ayude al comercial a mejorar su estrategia de venta.

Información disponible:
- Lead: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio del Lead: {{{businessType}}}{{/if}}
{{#if leadNotes}}- Notas sobre el Lead (puede incluir menciones a competidores o desafíos): {{{leadNotes}}}{{/if}}
{{#if knownCompetitors.length}}
- Competidores Conocidos del Lead (según el usuario):
{{#each knownCompetitors}}
  - {{{this}}}
{{/each}}
{{/if}}
{{#if userProductForComparison}}
- Producto/Servicio del Usuario a Posicionar:
  - Nombre: {{{userProductForComparison.name}}}
  - Descripción: {{{userProductForComparison.description}}}
  - Precio: {{{userProductForComparison.price_usd}}}
{{/if}}

Instrucciones para el Análisis:
1.  **Enfoque del Negocio del Lead (Opcional):** Si es posible inferirlo, describe brevemente el nicho o enfoque principal del negocio del lead "{{{leadName}}}".
2.  **Tipos de Competidores Potenciales (si no se especifican):** Si no se listaron competidores directos, sugiere 1-2 tipos generales de competencia que un negocio como "{{{leadName}}}" podría enfrentar (ej. "grandes jugadores establecidos", "nuevos disruptores ágiles", "soluciones alternativas").
3.  **Dimensiones Comparativas Clave (2-4 dimensiones):**
    *   Identifica aspectos cruciales donde los negocios del tipo "{{{businessType}}}" suelen competir (ej. Precio, Calidad, Innovación, Servicio al Cliente, Rapidez, Personalización).
    *   Para cada dimensión:
        *   **Sugerencia de Posicionamiento del Usuario (Opcional):** Si se proporcionó un producto del usuario ({{{userProductForComparison.name}}}), sugiere brevemente cómo este producto podría destacarse o qué argumento de venta se podría usar en esta dimensión frente a los competidores (ya sean los {{{knownCompetitors}}} o los tipos generales).
        *   **Pregunta para el Lead (Opcional):** Formula una pregunta que el comercial podría hacerle sutilmente al lead para entender cómo percibe a sus competidores actuales en esa dimensión, o qué valora más.
4.  **Consejo Estratégico General (Opcional):** Ofrece un consejo general sobre cómo abordar el tema de la competencia con este lead, o cómo diferenciar la oferta del usuario.

El objetivo no es hacer un análisis exhaustivo de mercado, sino proporcionar puntos de partida y ángulos de conversación para que el comercial pueda posicionar mejor su oferta.
Sé práctico y enfócate en lo que el comercial puede usar en sus interacciones.

Genera la respuesta en el formato JSON especificado.`,
});

const generateCompetitorAnalysisInsightsFlow = ai.defineFlow(
  {
    name: 'generateCompetitorAnalysisInsightsFlow',
    inputSchema: GenerateCompetitorAnalysisInsightsInputSchema,
    outputSchema: GenerateCompetitorAnalysisInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudieron generar insights de análisis de competidores.');
    }
    return output;
  }
);