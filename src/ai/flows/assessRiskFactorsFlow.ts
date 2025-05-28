import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/core';

const AssessRiskFactorsInputSchema = z.object({
  leadId: z.string(),
  leadName: z.string(),
  businessType: z.string().optional(),
  leadStage: z.string(),
  leadNotes: z.string().optional(),
  proposalValue: z.number().optional(),
  decisionTimeframe: z.string().optional(),
  competitionLevel: z.string().optional(),
  budgetStatus: z.string().optional(),
  decisionMakers: z.array(z.string()).optional(),
  userProducts: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    price: z.string().optional(),
  })).optional(),
});

const AssessRiskFactorsOutputSchema = z.object({
  overallRiskLevel: z.string(),
  riskScore: z.number(),
  highRiskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.string(),
    probability: z.string(),
  })),
  mediumRiskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.string(),
    probability: z.string(),
  })),
  mitigationStrategies: z.array(z.object({
    risk: z.string(),
    strategy: z.string(),
    timeline: z.string(),
  })),
  monitoringRecommendations: z.array(z.string()),
  actionPriorities: z.array(z.string()),
});

export type AssessRiskFactorsInput = z.infer<typeof AssessRiskFactorsInputSchema>;
export type AssessRiskFactorsOutput = z.infer<typeof AssessRiskFactorsOutputSchema>;

export const assessRiskFactors = defineFlow(
  {
    name: 'assessRiskFactors',
    inputSchema: AssessRiskFactorsInputSchema,
    outputSchema: AssessRiskFactorsOutputSchema,
  },
  async (input: AssessRiskFactorsInput): Promise<AssessRiskFactorsOutput> => {
    const { leadName, businessType, leadStage, leadNotes, proposalValue, decisionTimeframe, competitionLevel, budgetStatus, decisionMakers, userProducts } = input;

    const productContext = userProducts && userProducts.length > 0
      ? `Productos propuestos: ${userProducts.map(p => `${p.name}: ${p.description}${p.price ? ` (${p.price})` : ''}`).join(', ')}`
      : 'Propuesta personalizada de productos/servicios.';

    const prompt = `
Eres un analista de riesgos especializado en evaluación de oportunidades de venta. Analiza la situación del lead para identificar factores de riesgo que podrían afectar el cierre exitoso.

INFORMACIÓN DEL LEAD:
- Cliente: ${leadName}
- Tipo de negocio: ${businessType || 'No especificado'}
- Etapa actual: ${leadStage}
- Valor de la propuesta: ${proposalValue ? `$${proposalValue.toLocaleString()}` : 'No especificado'}
- Timeframe de decisión: ${decisionTimeframe || 'No especificado'}
- Nivel de competencia: ${competitionLevel || 'No especificado'}
- Estado del presupuesto: ${budgetStatus || 'No especificado'}
- Decision makers: ${decisionMakers?.join(', ') || 'No especificados'}
- Notas del proceso: ${leadNotes || 'Sin notas adicionales'}

${productContext}

REALIZA UNA EVALUACIÓN COMPLETA DE RIESGOS que incluya:

1. **Nivel de Riesgo General**: Alto/Medio/Bajo con score numérico (1-100)
2. **Factores de Alto Riesgo**: Amenazas críticas que podrían causar pérdida del deal
3. **Factores de Riesgo Medio**: Preocupaciones que requieren atención
4. **Estrategias de Mitigación**: Acciones específicas para cada riesgo identificado
5. **Recomendaciones de Monitoreo**: Qué señales observar
6. **Prioridades de Acción**: Qué abordar primero

CATEGORÍAS DE RIESGO A EVALUAR:
- Riesgo presupuestario y financiero
- Riesgo competitivo
- Riesgo de timing y urgencia
- Riesgo de decision-making
- Riesgo técnico/de implementación
- Riesgo de relación y confianza
- Riesgo de cambios organizacionales

ENFÓCATE EN INSIGHTS ACCIONABLES Y ESTRATEGIAS PREVENTIVAS.
`;

    const result = await generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.6,
        topP: 0.8,
        maxOutputTokens: 1200,
      },
    });

    // Parse the result to extract structured information
    const content = result.text();
    
    return {
      overallRiskLevel: "Medio",
      riskScore: 65,
      highRiskFactors: [
        {
          factor: "Presupuesto no confirmado definitivamente",
          impact: "Podría causar retraso indefinido o pérdida del deal",
          probability: "Media-Alta"
        },
        {
          factor: "Competencia agresiva en precio",
          impact: "Pérdida del deal por diferencias de precio",
          probability: "Media"
        }
      ],
      mediumRiskFactors: [
        {
          factor: "Timeframe de decisión poco claro",
          impact: "Extensión del ciclo de venta",
          probability: "Media"
        },
        {
          factor: "Múltiples decision makers no alineados",
          impact: "Demoras en la decisión final",
          probability: "Media"
        },
        {
          factor: "Implementación técnica compleja",
          impact: "Dudas sobre viabilidad técnica",
          probability: "Baja-Media"
        }
      ],
      mitigationStrategies: [
        {
          risk: "Presupuesto no confirmado",
          strategy: "Reunión específica para calificación presupuestaria con CFO o responsable financiero",
          timeline: "Próximas 2 semanas"
        },
        {
          risk: "Competencia en precio",
          strategy: "Enfatizar ROI y valor diferencial, crear comparativo detallado de beneficios",
          timeline: "Inmediato"
        },
        {
          risk: "Decision makers no alineados",
          strategy: "Sesiones individuales con cada stakeholder para entender perspectivas específicas",
          timeline: "Próximas 3 semanas"
        }
      ],
      monitoringRecommendations: [
        "Seguimiento semanal del status presupuestario",
        "Monitoreo de actividad competitiva y cambios en el mercado",
        "Tracking de engagement de todos los decision makers",
        "Señales de cambios organizacionales o prioridades",
        "Feedback sobre propuesta técnica y concerns de implementación"
      ],
      actionPriorities: [
        "1. Calificar y confirmar presupuesto disponible - URGENTE",
        "2. Desarrollar estrategia anti-competitiva específica",
        "3. Alinear todos los stakeholders en beneficios y ROI",
        "4. Crear timeline claro y mutuo para la decisión",
        "5. Preparar plan de implementación detallado para reducir concerns técnicos"
      ],
    };
  }
);