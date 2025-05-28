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
import type { GenerateRecoveryStrategyOutput } from '@/ai/flows/generateRecoveryStrategyFlow';
import type { AnalyzeLossReasonsOutput } from '@/ai/flows/analyzeLossReasonsFlow';
import type { GenerateCompetitorReportOutput } from '@/ai/flows/generateCompetitorReportFlow';
import type { GenerateThankYouMessageOutput } from '@/ai/flows/generateThankYouMessageFlow';
import type { GenerateCrossSellOpportunitiesOutput } from '@/ai/flows/generateCrossSellOpportunitiesFlow';
import type { GenerateCustomerSurveyOutput } from '@/ai/flows/generateCustomerSurveyFlow';
import type { AssessRiskFactorsOutput } from '@/ai/flows/assessRiskFactorsFlow';

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
  | GenerateRecoveryStrategyOutput
  | AnalyzeLossReasonsOutput
  | GenerateCompetitorReportOutput
  | GenerateThankYouMessageOutput
  | GenerateCrossSellOpportunitiesOutput
  | GenerateCustomerSurveyOutput
  | AssessRiskFactorsOutput
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
  | "Análisis de Competencia"
  | "Recordatorio de Seguimiento"
  | "Tácticas de Negociación"
  | "Estrategia de Negociación"
  | "Contraoferta"
  | "Recuperación"
  | "Análisis de Pérdidas"
  | "Informe de Competidores"
  | "Agradecimiento"
  | "Venta Cruzada"
  | "Encuesta Cliente"
  | "Evaluación de Riesgos";