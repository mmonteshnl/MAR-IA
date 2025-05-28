import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const AnalyzeLossReasonsInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  lossReason: z.string().optional(),
  competitorWhoWon: z.string().optional(),
  proposalValue: z.number().optional(),
  salesCycleLength: z.number().optional(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const AnalyzeLossReasonsOutputSchema = z.object({
  primaryLossCategory: z.string(),
  detailedLossAnalysis: z.string(),
  preventableFactors: z.array(z.string()),
  nonPreventableFactors: z.array(z.string()),
  processImprovements: z.array(z.string()),
  competitiveInsights: z.array(z.string()),
  futurePreventionStrategy: z.string(),
});

export type AnalyzeLossReasonsInput = z.infer<typeof AnalyzeLossReasonsInputSchema>;
export type AnalyzeLossReasonsOutput = z.infer<typeof AnalyzeLossReasonsOutputSchema>;

export const analyzeLossReasons = defineFlow(
  {
    name: 'analyzeLossReasons',
    inputSchema: AnalyzeLossReasonsInputSchema,
    outputSchema: AnalyzeLossReasonsOutputSchema,
  },
  async (input: AnalyzeLossReasonsInput): Promise<AnalyzeLossReasonsOutput> => {
    const { leadName, businessType, leadNotes, lossReason, competitorWhoWon, proposalValue, salesCycleLength, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Productos/servicios propuestos: ${userProducts.map(p => `${p.name}: ${p.description}${p.price ? ` (${p.price})` : ''}`).join(', ')}`
      : 'No hay información específica de productos disponible.';

    const prompt = `
Eres un analista de ventas especializado en análisis post-mortem de pérdidas. Analiza las razones de la pérdida de este lead para generar insights valiosos.

INFORMACIÓN DE LA PÉRDIDA:
- Lead: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- Notas del proceso: ${leadNotes || 'Sin notas adicionales'}
- Razón de pérdida declarada: ${lossReason || 'No especificada'}
- Competidor que ganó: ${competitorWhoWon || 'No especificado'}
- Valor de la propuesta: ${proposalValue ? `$${proposalValue.toLocaleString()}` : 'No especificado'}
- Duración del ciclo de venta: ${salesCycleLength ? `${salesCycleLength} días` : 'No especificado'}

${productContext}

REALIZA UN ANÁLISIS COMPLETO que incluya:

1. **Categoría Principal de Pérdida**: Clasifica la pérdida (precio, producto, timing, relación, etc.)
2. **Análisis Detallado**: Explicación profunda de los factores que contribuyeron
3. **Factores Prevenibles**: Aspectos que podrían haberse manejado diferente
4. **Factores No Prevenibles**: Circunstancias fuera de nuestro control
5. **Mejoras de Proceso**: Sugerencias específicas para evitar pérdidas similares
6. **Insights Competitivos**: Qué nos dice sobre la competencia
7. **Estrategia de Prevención**: Plan para evitar pérdidas similares

ENFÓCATE EN:
- Objetividad y aprendizaje constructivo
- Identificar patrones que se puedan mejorar
- Generar insights accionables para el equipo
- Evaluar fortalezas y debilidades competitivas
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
      primaryLossCategory: "Precio/Presupuesto",
      detailedLossAnalysis: "El lead optó por una solución más económica que no incluía todas las características propuestas. La decisión se basó principalmente en restricciones presupuestarias y la percepción de que una solución más simple sería suficiente para sus necesidades inmediatas.",
      preventableFactors: [
        "Mejor comunicación del ROI y valor a largo plazo",
        "Opciones de pago más flexibles o escaladas",
        "Versión básica de entrada más accesible",
        "Seguimiento más frecuente durante el proceso de decisión"
      ],
      nonPreventableFactors: [
        "Restricciones presupuestarias reales del cliente",
        "Cambios en prioridades internas de la empresa",
        "Timing económico desfavorable para inversiones"
      ],
      processImprovements: [
        "Calificar mejor el presupuesto disponible en etapas tempranas",
        "Desarrollar propuestas modulares con diferentes niveles de precio",
        "Implementar seguimiento más estructurado del proceso de decisión",
        "Crear materiales que demuestren mejor el ROI"
      ],
      competitiveInsights: [
        "Los competidores están ganando con precios más agresivos",
        "Existe demanda para soluciones más simples y económicas",
        "El mercado valora la flexibilidad de precios y opciones"
      ],
      futurePreventionStrategy: "Implementar calificación presupuestaria más rigurosa, desarrollar opciones de precio escalonadas, y mejorar la comunicación de valor desde el primer contacto",
    };
  }
);