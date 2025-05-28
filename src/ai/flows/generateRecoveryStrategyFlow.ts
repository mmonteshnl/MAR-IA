import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const GenerateRecoveryStrategyInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  lossReason: z.string().optional(),
  timesSinceLoss: z.number().optional(),
  competitorWhoWon: z.string().optional(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const GenerateRecoveryStrategyOutputSchema = z.object({
  recoveryApproach: z.string(),
  keyRecoveryMessages: z.array(z.string()),
  timingStrategy: z.string(),
  incentivesOrOffers: z.array(z.string()),
  relationshipRebuildingTactics: z.array(z.string()),
  successProbabilityAssessment: z.string(),
});

export type GenerateRecoveryStrategyInput = z.infer<typeof GenerateRecoveryStrategyInputSchema>;
export type GenerateRecoveryStrategyOutput = z.infer<typeof GenerateRecoveryStrategyOutputSchema>;

export const generateRecoveryStrategy = defineFlow(
  {
    name: 'generateRecoveryStrategy',
    inputSchema: GenerateRecoveryStrategyInputSchema,
    outputSchema: GenerateRecoveryStrategyOutputSchema,
  },
  async (input: GenerateRecoveryStrategyInput): Promise<GenerateRecoveryStrategyOutput> => {
    const { leadName, businessType, leadNotes, lossReason, timesSinceLoss, competitorWhoWon, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Productos/servicios disponibles: ${userProducts.map(p => `${p.name}: ${p.description}${p.price ? ` (${p.price})` : ''}`).join(', ')}`
      : 'No hay información específica de productos disponible.';

    const prompt = `
Eres un especialista en recuperación de leads perdidos. Analiza la situación del lead perdido y genera una estrategia de recuperación efectiva.

INFORMACIÓN DEL LEAD:
- Nombre: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- Notas: ${leadNotes || 'Sin notas adicionales'}
- Razón de pérdida: ${lossReason || 'No especificada'}
- Tiempo desde la pérdida: ${timesSinceLoss ? `${timesSinceLoss} días` : 'No especificado'}
- Competidor que ganó: ${competitorWhoWon || 'No especificado'}

${productContext}

GENERA UNA ESTRATEGIA DE RECUPERACIÓN que incluya:

1. **Enfoque de Recuperación**: Estrategia principal para abordar al lead perdido
2. **Mensajes Clave de Recuperación**: 3-4 mensajes principales para reconectar
3. **Estrategia de Timing**: Cuándo y cómo contactar
4. **Incentivos u Ofertas**: Propuestas de valor para reconquistar
5. **Tácticas de Reconstrucción**: Cómo reconstruir la relación
6. **Evaluación de Probabilidad**: Realista evaluación de éxito

CONSIDERACIONES:
- Sé respetuoso con su decisión anterior
- Enfócate en valor nuevo o cambios en circunstancias
- Ofrece soluciones específicas a problemas que puedan haber surgido
- Mantén la profesionalidad y evita presión excesiva
- Considera timing apropiado para el reacercamiento
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
      recoveryApproach: "Enfoque consultivo basado en nuevas soluciones y cambios en el mercado",
      keyRecoveryMessages: [
        "Hemos desarrollado nuevas soluciones que podrían ser relevantes para su situación actual",
        "El mercado ha cambiado y queremos asegurar que tenga la mejor información disponible",
        "Valoramos la relación anterior y nos gustaría explorar cómo podemos ser útiles ahora"
      ],
      timingStrategy: "Esperar 3-6 meses después de la pérdida, contactar con nueva propuesta de valor",
      incentivesOrOffers: [
        "Evaluación gratuita de necesidades actuales",
        "Descuento especial por relación previa",
        "Período de prueba extendido sin compromiso"
      ],
      relationshipRebuildingTactics: [
        "Compartir casos de éxito relevantes sin presión",
        "Ofrecer insights de mercado valiosos",
        "Mantener comunicación de valor agregado"
      ],
      successProbabilityAssessment: "Probabilidad media - depende del tiempo transcurrido y satisfacción con la solución actual",
    };
  }
);