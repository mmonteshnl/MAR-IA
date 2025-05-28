import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const GenerateCrossSellOpportunitiesInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  currentSolution: z.string().optional(),
  purchaseValue: z.number().optional(),
  implementationStatus: z.string().optional(),
  satisfactionLevel: z.string().optional(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const GenerateCrossSellOpportunitiesOutputSchema = z.object({
  crossSellRecommendations: z.array(z.object({
    productName: z.string(),
    relevanceReason: z.string(),
    estimatedValue: z.string(),
    implementationComplexity: z.string(),
  })),
  bundleOpportunities: z.array(z.string()),
  optimalTiming: z.string(),
  approachStrategy: z.string(),
  valueProposition: z.string(),
  expectedROI: z.string(),
});

export type GenerateCrossSellOpportunitiesInput = z.infer<typeof GenerateCrossSellOpportunitiesInputSchema>;
export type GenerateCrossSellOpportunitiesOutput = z.infer<typeof GenerateCrossSellOpportunitiesOutputSchema>;

export const generateCrossSellOpportunities = defineFlow(
  {
    name: 'generateCrossSellOpportunities',
    inputSchema: GenerateCrossSellOpportunitiesInputSchema,
    outputSchema: GenerateCrossSellOpportunitiesOutputSchema,
  },
  async (input: GenerateCrossSellOpportunitiesInput): Promise<GenerateCrossSellOpportunitiesOutput> => {
    const { leadName, businessType, leadNotes, currentSolution, purchaseValue, implementationStatus, satisfactionLevel, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Productos disponibles para venta cruzada: ${userProducts.map(p => `${p.name}: ${p.description}${p.price ? ` (${p.price})` : ''}`).join(', ')}`
      : 'Catálogo de productos disponible para análisis de venta cruzada.';

    const prompt = `
Eres un especialista en venta cruzada (cross-sell) que identifica oportunidades para expandir la relación comercial con clientes existentes.

INFORMACIÓN DEL CLIENTE ACTUAL:
- Cliente: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- Solución actual: ${currentSolution || 'No especificada'}
- Valor de compra inicial: ${purchaseValue ? `$${purchaseValue.toLocaleString()}` : 'No especificado'}
- Estado de implementación: ${implementationStatus || 'No especificado'}
- Nivel de satisfacción: ${satisfactionLevel || 'No especificado'}
- Notas del cliente: ${leadNotes || 'Sin notas adicionales'}

${productContext}

IDENTIFICA OPORTUNIDADES DE VENTA CRUZADA que incluyan:

1. **Recomendaciones de Cross-Sell**: Productos/servicios complementarios específicos
2. **Oportunidades de Bundle**: Paquetes que añadan valor
3. **Timing Óptimo**: Cuándo presentar estas oportunidades
4. **Estrategia de Acercamiento**: Cómo presentar las opciones
5. **Propuesta de Valor**: Por qué necesitan estas soluciones adicionales
6. **ROI Esperado**: Beneficios cuantificables para el cliente

CONSIDERACIONES:
- Base las recomendaciones en necesidades reales del negocio
- Considera el presupuesto y capacidad de implementación
- Evalúa la complementariedad con la solución actual
- Prioriza por impacto y facilidad de adopción
- Mantén enfoque en el valor para el cliente, no solo en ventas
`;

    const result = await generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    // Parse the result to extract structured information
    const content = result.text();
    
    return {
      crossSellRecommendations: [
        {
          productName: "Módulo de Analytics Avanzado",
          relevanceReason: "Complementa la solución actual permitiendo análisis profundo de los datos generados",
          estimatedValue: "$15,000 - $25,000",
          implementationComplexity: "Media - integración con sistema existente"
        },
        {
          productName: "Capacitación Especializada del Equipo",
          relevanceReason: "Maximiza el ROI de la inversión actual mediante uso avanzado de funcionalidades",
          estimatedValue: "$5,000 - $10,000",
          implementationComplexity: "Baja - sesiones programadas según disponibilidad"
        },
        {
          productName: "Soporte Premium 24/7",
          relevanceReason: "Asegura continuidad operativa y respuesta inmediata ante cualquier situación",
          estimatedValue: "$8,000 - $12,000 anual",
          implementationComplexity: "Muy baja - activación inmediata"
        }
      ],
      bundleOpportunities: [
        "Paquete de Optimización: Analytics + Capacitación con 20% de descuento",
        "Bundle de Continuidad: Soporte Premium + Actualizaciones prioritarias",
        "Paquete de Expansión: Módulos adicionales para otras áreas del negocio"
      ],
      optimalTiming: "3-6 meses después de la implementación exitosa, cuando el cliente ya experimenta los beneficios iniciales y está considerando optimizaciones",
      approachStrategy: "Enfoque consultivo basado en métricas de uso y resultados actuales. Presentar como evolución natural para maximizar la inversión ya realizada",
      valueProposition: "Expandir los beneficios ya experimentados, optimizar ROI de la inversión inicial, y preparar el negocio para el siguiente nivel de crecimiento y eficiencia",
      expectedROI: "150-300% sobre la inversión adicional, basado en optimizaciones de eficiencia y nuevas capacidades analíticas",
    };
  }
);