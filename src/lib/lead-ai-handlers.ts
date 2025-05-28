'use client';

import type { Lead } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

// AI Flow imports
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';
import { evaluateBusinessFeatures, type EvaluateBusinessInput } from '@/ai/flows/evaluateBusinessFlow';
import { generateSalesRecommendations, type SalesRecommendationsInput, type Product as AIProduct } from '@/ai/flows/salesRecommendationsFlow';
import { generateContactStrategy, type GenerateContactStrategyInput } from '@/ai/flows/generateContactStrategyFlow';
import { suggestBestFollowUpTimes, type SuggestBestFollowUpTimesInput } from '@/ai/flows/suggestBestFollowUpTimesFlow';
import { generateFollowUpEmail, type GenerateFollowUpEmailInput } from '@/ai/flows/generateFollowUpEmailFlow';
import { generateObjectionHandlingGuidance, type GenerateObjectionHandlingGuidanceInput } from '@/ai/flows/generateObjectionHandlingGuidanceFlow';
import { generateProposalSummary, type GenerateProposalSummaryInput } from '@/ai/flows/generateProposalSummaryFlow';
import { generateCompetitorAnalysisInsights, type GenerateCompetitorAnalysisInsightsInput } from '@/ai/flows/generateCompetitorAnalysisInsightsFlow';
import { generateFollowUpReminderMessage, type GenerateFollowUpReminderMessageInput } from '@/ai/flows/generateFollowUpReminderMessageFlow';
import { suggestNegotiationTactics, type SuggestNegotiationTacticsInput } from '@/ai/flows/suggestNegotiationTacticsFlow';
import { developNegotiationStrategy, type DevelopNegotiationStrategyInput } from '@/ai/flows/developNegotiationStrategyFlow';
import { generateCounterOfferMessage, type GenerateCounterOfferMessageInput } from '@/ai/flows/generateCounterOfferMessageFlow';
import { generateRecoveryStrategy, type GenerateRecoveryStrategyInput } from '@/ai/flows/generateRecoveryStrategyFlow';
import { analyzeLossReasons, type AnalyzeLossReasonsInput } from '@/ai/flows/analyzeLossReasonsFlow';
import { generateCompetitorReport, type GenerateCompetitorReportInput } from '@/ai/flows/generateCompetitorReportFlow';
import { generateThankYouMessage, type GenerateThankYouMessageInput } from '@/ai/flows/generateThankYouMessageFlow';
import { generateCrossSellOpportunities, type GenerateCrossSellOpportunitiesInput } from '@/ai/flows/generateCrossSellOpportunitiesFlow';
import { generateCustomerSurvey, type GenerateCustomerSurveyInput } from '@/ai/flows/generateCustomerSurveyFlow';
import { assessRiskFactors, type AssessRiskFactorsInput } from '@/ai/flows/assessRiskFactorsFlow';

import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const isFieldMissing = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined || value.trim() === "") return true;
  const lowerValue = value.toLowerCase();
  return lowerValue === "null" || lowerValue === "string";
};

// --- Transformers ---
function transformUserProductsSimple(products: AIProduct[] | undefined): { name: string; description: string; category?: string; price?: string }[] | undefined {
  if (!products) return undefined;
  return products.map(p => ({
    name: p.name,
    description: typeof p.description === "string" ? p.description : "",
    category: p.category || "",
    price: p.price_usd ? String(p.price_usd) : undefined,
  }));
}
function transformUserProductsFull(products: AIProduct[] | undefined): { name: string; category: string; price_usd: string; original_price_usd?: string; description: string }[] | undefined {
  if (!products) return undefined;
  return products.map(p => ({
    name: p.name,
    category: p.category || "",
    price_usd: String(p.price_usd ?? ""),
    original_price_usd: p.original_price_usd ? String(p.original_price_usd) : undefined,
    description: typeof p.description === "string" ? p.description : "",
  }));
}

interface HandlerContext {
  user: FirebaseUser;
  lead: Lead;
  userProducts?: AIProduct[];
}

export const handleGenerateWelcomeMessage = async ({ user, lead }: HandlerContext) => {
  const input: WelcomeMessageInput = { 
    leadName: lead.name, 
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!
  };
  return await generateWelcomeMessage(input);
};

export const handleEvaluateBusiness = async ({ user, lead }: HandlerContext) => {
  const input: EvaluateBusinessInput = {
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    address: isFieldMissing(lead.address) ? undefined : lead.address!,
    website: isFieldMissing(lead.website) ? undefined : lead.website!,
  };
  return await evaluateBusinessFeatures(input);
};

export const handleGenerateSalesRecommendations = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  let currentProducts = userProducts;
  
  // If no products provided, fetch from Firestore
  if (currentProducts.length === 0 && user) {
    const productsRef = collection(db, 'userProducts');
    const q = query(productsRef);
    const querySnapshot = await getDocs(q);
    currentProducts = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        name: data.name ?? "",
        category: data.category ?? "",
        price_usd: String(data.price_usd ?? ""),
        original_price_usd: data.original_price_usd ? String(data.original_price_usd) : undefined,
        description: data.description ?? "",
      };
    });
  }

  const input: SalesRecommendationsInput = {
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    userProducts: currentProducts.length > 0 ? transformUserProductsSimple(currentProducts) : undefined,
    businessEvaluation: isFieldMissing(lead.notes) ? undefined : lead.notes!,
  };
  return await generateSalesRecommendations(input);
};

export const handleGenerateContactStrategy = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: GenerateContactStrategyInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    userProducts: userProducts.length > 0 ? transformUserProductsSimple(userProducts) : undefined,
  };
  return await generateContactStrategy(input);
};

export const handleSuggestBestFollowUpTimes = async ({ user, lead }: HandlerContext) => {
  const input: SuggestBestFollowUpTimesInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
  };
  return await suggestBestFollowUpTimes(input);
};

export const handleGenerateFollowUpEmail = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
  
  const input: GenerateFollowUpEmailInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    previousContextSummary: "Primera conversación sobre sus necesidades",
    senderName: userName,
    senderCompany: companyName,
    userProducts: userProducts.length > 0 ? transformUserProductsSimple(userProducts) : undefined,
  };
  return await generateFollowUpEmail(input);
};

export const handleGenerateObjectionHandlingGuidance = async ({ user, lead }: HandlerContext) => {
  const input: GenerateObjectionHandlingGuidanceInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    objectionRaised: "Es muy caro", // TODO: Get from actual conversation or allow user input
    stageInSalesProcess: lead.stage,
  };
  return await generateObjectionHandlingGuidance(input);
};

export const handleGenerateProposalSummary = async ({ user, lead }: HandlerContext) => {
  const input: GenerateProposalSummaryInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    fullProposalDetails: {
      problemStatement: "Necesidad de mejorar la presencia digital y automatizar procesos de ventas",
      proposedSolution: "Implementación de sistema CRM integrado con herramientas de marketing digital",
      keyDeliverables: [
        "Configuración de CRM personalizado",
        "Integración con redes sociales y email",
        "Capacitación del equipo",
        "Soporte por 3 meses"
      ],
      pricingSummary: "Inversión total: $5,000 USD con plan de pago flexible",
      callToAction: "Agendar reunión de kick-off para la próxima semana"
    },
    targetAudienceForSummary: "Decisor principal"
  };
  return await generateProposalSummary(input);
};

export const handleGenerateCompetitorAnalysisInsights = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: GenerateCompetitorAnalysisInsightsInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    userProductForComparison: userProducts.length > 0 ? userProducts[0] : undefined,
  };
  return await generateCompetitorAnalysisInsights(input);
};

export const handleGenerateFollowUpReminderMessage = async ({ user, lead }: HandlerContext) => {
  const input: GenerateFollowUpReminderMessageInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    reminderReason: "Seguimiento de propuesta enviada",
    daysSinceLastContact: 3,
  };
  return await generateFollowUpReminderMessage(input);
};

export const handleSuggestNegotiationTactics = async ({ user, lead }: HandlerContext) => {
  const input: SuggestNegotiationTacticsInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    negotiationContext: "Lead interesado pero preocupado por el precio. Ya acordamos características técnicas.",
    dealValue: "$5,000 USD",
  };
  return await suggestNegotiationTactics(input);
};

export const handleDevelopNegotiationStrategy = async ({ user, lead }: HandlerContext) => {
  const input: DevelopNegotiationStrategyInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    negotiationContext: "Lead interesado pero preocupado por el precio. Ya acordamos características técnicas.",
    dealValue: "$5,000 USD",
    desiredRelationshipPostSale: "Socio a largo plazo",
  };
  return await developNegotiationStrategy(input);
};

export const handleGenerateCounterOfferMessage = async ({ user, lead }: HandlerContext) => {
  const input: GenerateCounterOfferMessageInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    leadOfferOrProposal: "Proponen $3,500 USD pagado en 6 meses",
    desiredTermsForCounterOffer: "$4,500 USD con 20% inicial y resto en 3 meses",
    justificationForCounterOffer: "Necesitamos flujo de caja más rápido para garantizar el mejor servicio",
  };
  return await generateCounterOfferMessage(input);
};

// Handlers for "Perdido" stage
export const handleGenerateRecoveryStrategy = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: GenerateRecoveryStrategyInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    lossReason: "Optaron por competidor con precio más bajo",
    timesSinceLoss: 30,
    competitorWhoWon: "Competidor local",
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await generateRecoveryStrategy(input);
};

export const handleAnalyzeLossReasons = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: AnalyzeLossReasonsInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    lossReason: "Precio demasiado alto para su presupuesto",
    competitorWhoWon: "Competidor con solución más básica",
    proposalValue: 5000,
    salesCycleLength: 45,
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await analyzeLossReasons(input);
};

export const handleGenerateCompetitorReport = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: GenerateCompetitorReportInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    competitorWhoWon: "SoftLocal Solutions",
    competitorSolution: "Sistema CRM básico con funcionalidades limitadas",
    competitorPrice: 3500,
    ourProposalValue: 5000,
    lossReason: "Diferencia de precio y simplicidad de implementación",
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await generateCompetitorReport(input);
};

// Handlers for "Ganado" stage
export const handleGenerateThankYouMessage = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
  
  const input: GenerateThankYouMessageInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    purchasedSolution: userProducts.length > 0 ? userProducts[0].name : "Solución personalizada",
    purchaseValue: 5000,
    implementationDate: "Próximas 2 semanas",
    senderName: userName,
    senderCompany: companyName,
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await generateThankYouMessage(input);
};

export const handleGenerateCrossSellOpportunities = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: GenerateCrossSellOpportunitiesInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    currentSolution: userProducts.length > 0 ? userProducts[0].name : "Solución implementada",
    purchaseValue: 5000,
    implementationStatus: "Exitosa - 3 meses de uso",
    satisfactionLevel: "Alta",
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await generateCrossSellOpportunities(input);
};

export const handleGenerateCustomerSurvey = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
  
  const input: GenerateCustomerSurveyInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    purchasedSolution: userProducts.length > 0 ? userProducts[0].name : "Solución implementada",
    implementationDate: "Hace 3 meses",
    timeWithSolution: 90,
    senderName: userName,
    senderCompany: companyName,
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await generateCustomerSurvey(input);
};

// Handler for risk assessment (any stage)
export const handleAssessRiskFactors = async ({ user, lead, userProducts = [] }: HandlerContext) => {
  const input: AssessRiskFactorsInput = {
    leadId: lead.id,
    leadName: lead.name,
    businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
    leadStage: lead.stage,
    leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    proposalValue: 5000,
    decisionTimeframe: "Próximas 4 semanas",
    competitionLevel: "Media - 2 competidores identificados",
    budgetStatus: "Confirmado pero ajustado",
    decisionMakers: ["CEO", "CFO", "CTO"],
    userProducts: userProducts.length > 0 ? transformUserProductsFull(userProducts) : undefined,
  };
  return await assessRiskFactors(input);
};
