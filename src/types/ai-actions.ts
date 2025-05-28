// Types for AI action results
import type { WelcomeMessageOutput } from '@/ai/flows/welcomeMessageFlow';
import type { EvaluateBusinessOutput } from '@/ai/flows/evaluateBusinessFlow';
import type { SalesRecommendationsOutput } from '@/ai/flows/salesRecommendationsFlow';
import type { GenerateContactStrategyOutput } from '@/ai/flows/generateContactStrategyFlow';
import type { SuggestBestFollowUpTimesOutput } from '@/ai/flows/suggestBestFollowUpTimesFlow';
import type { GenerateFollowUpEmailOutput } from '@/ai/flows/generateFollowUpEmailFlow';
import type { GenerateObjectionHandlingGuidanceOutput } from '@/ai/flows/generateObjectionHandlingGuidanceFlow';
import type { GenerateProposalSummaryOutput } from '@/ai/flows/generateProposalSummaryFlow';
import type { GenerateCompetitorAnalysisInsightsOutput } from '@/ai/flows/generateCompetitorAnalysisInsightsFlow';
import type { GenerateFollowUpReminderMessageOutput } from '@/ai/flows/generateFollowUpReminderMessageFlow';
import type { SuggestNegotiationTacticsOutput } from '@/ai/flows/suggestNegotiationTacticsFlow';
import type { DevelopNegotiationStrategyOutput } from '@/ai/flows/developNegotiationStrategyFlow';
import type { GenerateCounterOfferMessageOutput } from '@/ai/flows/generateCounterOfferMessageFlow';

export type ActionResult = 
  | WelcomeMessageOutput 
  | EvaluateBusinessOutput 
  | SalesRecommendationsOutput 
  | GenerateContactStrategyOutput 
  | SuggestBestFollowUpTimesOutput 
  | GenerateFollowUpEmailOutput 
  | GenerateObjectionHandlingGuidanceOutput 
  | GenerateProposalSummaryOutput
  | GenerateCompetitorAnalysisInsightsOutput
  | GenerateFollowUpReminderMessageOutput
  | SuggestNegotiationTacticsOutput
  | DevelopNegotiationStrategyOutput
  | GenerateCounterOfferMessageOutput
  | { error: string } 
  | null;

export type ActionType = 
  | "Mensaje de Bienvenida"
  | "Evaluación de Negocio"
  | "Recomendaciones de Venta"
  | "Estrategias de Contacto"
  | "Mejores Momentos"
  | "Email de Seguimiento"
  | "Manejo de Objeciones"
  | "Resumen Propuesta"
  | "Análisis Competidores"
  | "Recordatorio Seguimiento"
  | "Tácticas Negociación"
  | "Estrategia Negociación"
  | "Contraoferta";