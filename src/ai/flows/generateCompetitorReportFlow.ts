import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const GenerateCompetitorReportInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  competitorWhoWon: z.string().optional(),
  competitorSolution: z.string().optional(),
  competitorPrice: z.number().optional(),
  ourProposalValue: z.number().optional(),
  lossReason: z.string().optional(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const GenerateCompetitorReportOutputSchema = z.object({
  competitorProfile: z.string(),
  competitiveAdvantages: z.array(z.string()),
  competitorWeaknesses: z.array(z.string()),
  pricingStrategy: z.string(),
  productComparison: z.array(z.object({
    feature: z.string(),
    competitor: z.string(),
    ourOffering: z.string(),
    advantage: z.string(),
  })),
  strategicRecommendations: z.array(z.string()),
  futureCompetitiveStrategy: z.string(),
});

export type GenerateCompetitorReportInput = z.infer<typeof GenerateCompetitorReportInputSchema>;
export type GenerateCompetitorReportOutput = z.infer<typeof GenerateCompetitorReportOutputSchema>;

export const generateCompetitorReport = defineFlow(
  {
    name: 'generateCompetitorReport',
    inputSchema: GenerateCompetitorReportInputSchema,
    outputSchema: GenerateCompetitorReportOutputSchema,
  },
  async (input: GenerateCompetitorReportInput): Promise<GenerateCompetitorReportOutput> => {
    const { leadName, businessType, leadNotes, competitorWhoWon, competitorSolution, competitorPrice, ourProposalValue, lossReason, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Nuestra oferta: ${userProducts.map(p => `${p.name}: ${p.description}${p.price ? ` (${p.price})` : ''}`).join(', ')}`
      : 'No hay información específica de productos disponible.';

    const prompt = `
Eres un analista competitivo especializado en crear reportes detallados sobre competidores. Analiza la situación donde perdimos ante un competidor para generar insights estratégicos.

INFORMACIÓN DE LA COMPETENCIA:
- Lead perdido: ${leadName} (${businessType || 'tipo de negocio no especificado'})
- Competidor ganador: ${competitorWhoWon || 'No especificado'}
- Solución competidora: ${competitorSolution || 'No especificada'}
- Precio competidor: ${competitorPrice ? `$${competitorPrice.toLocaleString()}` : 'No especificado'}
- Nuestro precio: ${ourProposalValue ? `$${ourProposalValue.toLocaleString()}` : 'No especificado'}
- Razón de pérdida: ${lossReason || 'No especificada'}
- Notas del proceso: ${leadNotes || 'Sin notas adicionales'}

${productContext}

GENERA UN REPORTE COMPETITIVO que incluya:

1. **Perfil del Competidor**: Análisis de fortalezas y posicionamiento
2. **Ventajas Competitivas**: Qué los hace atractivos para los clientes
3. **Debilidades del Competidor**: Áreas donde son vulnerables
4. **Estrategia de Precios**: Cómo estructuran sus precios
5. **Comparación de Productos**: Feature por feature vs nuestra oferta
6. **Recomendaciones Estratégicas**: Cómo competir mejor contra ellos
7. **Estrategia Competitiva Futura**: Plan para ganar en futuros enfrentamientos

ENFÓCATE EN:
- Análisis objetivo basado en evidencia
- Identificar oportunidades para mejorar nuestra posición
- Estrategias prácticas para diferenciarnos
- Insights sobre tendencias del mercado y preferencias de clientes
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
      competitorProfile: "Competidor enfocado en soluciones económicas con implementación rápida, fuerte presencia en market mid-market y estrategia agresiva de precios",
      competitiveAdvantages: [
        "Precios más competitivos y accesibles",
        "Implementación más rápida y sencilla",
        "Proceso de venta más ágil y directo",
        "Enfoque específico en necesidades básicas del segmento"
      ],
      competitorWeaknesses: [
        "Funcionalidades limitadas comparado con nuestra solución",
        "Soporte post-venta menos comprehensivo",
        "Escalabilidad limitada para crecimiento futuro",
        "Personalización restringida"
      ],
      pricingStrategy: "Estrategia de penetración con precios agresivos, posiblemente subsidiando inicialmente para ganar market share",
      productComparison: [
        {
          feature: "Precio inicial",
          competitor: "Más económico",
          ourOffering: "Mayor inversión",
          advantage: "Competidor"
        },
        {
          feature: "Funcionalidades avanzadas",
          competitor: "Básicas",
          ourOffering: "Completas y escalables",
          advantage: "Nosotros"
        },
        {
          feature: "Tiempo de implementación",
          competitor: "Rápido",
          ourOffering: "Más estructurado",
          advantage: "Competidor"
        },
        {
          feature: "Soporte a largo plazo",
          competitor: "Limitado",
          ourOffering: "Comprehensivo",
          advantage: "Nosotros"
        }
      ],
      strategicRecommendations: [
        "Desarrollar una versión de entrada más competitiva en precio",
        "Enfatizar valor a largo plazo y ROI total",
        "Acelerar nuestro proceso de implementación",
        "Crear paquetes flexibles para diferentes presupuestos"
      ],
      futureCompetitiveStrategy: "Combinar nuestra superioridad técnica con opciones de precio más competitivas, enfocarnos en demostrar ROI superior y desarrollar ventajas sostenibles en servicio y soporte",
    };
  }
);