'use client';

import type { Lead } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

// Helper function to check if field is missing
const isFieldMissing = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined || value.trim() === "") return true;
  const lowerValue = value.toLowerCase();
  return lowerValue === "null" || lowerValue === "string";
};

interface HandlerContext {
  user: FirebaseUser;
  lead: Lead;
  userProducts?: any[];
}

// API client functions for all AI flows
export const aiApiClient = {
  // Contact Strategy
  generateContactStrategy: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/contact-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar estrategias de contacto');
    }
    
    return await response.json();
  },

  // Best Follow-up Times
  suggestBestFollowUpTimes: async ({ user, lead }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
    };
    
    const response = await fetch('/api/ai/follow-up-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al sugerir mejores momentos');
    }
    
    return await response.json();
  },

  // Follow-up Email
  generateFollowUpEmail: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
    
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      previousContextSummary: "Primera conversación sobre sus necesidades",
      senderName: userName,
      senderCompany: companyName,
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/follow-up-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar email de seguimiento');
    }
    
    return await response.json();
  },

  // Objection Handling
  generateObjectionHandlingGuidance: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      commonObjections: ["Precio demasiado alto", "No tenemos presupuesto ahora", "Necesitamos pensar más"],
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/objection-handling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar manejo de objeciones');
    }
    
    return await response.json();
  },

  // Proposal Summary
  generateProposalSummary: async ({ user, lead }: HandlerContext) => {
    const input = {
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
    
    const response = await fetch('/api/ai/proposal-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar resumen de propuesta');
    }
    
    return await response.json();
  },

  // Competitor Analysis
  generateCompetitorAnalysisInsights: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      knownCompetitors: [],
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/competitor-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar análisis de competencia');
    }
    
    return await response.json();
  },

  // Follow-up Reminder
  generateFollowUpReminderMessage: async ({ user, lead }: HandlerContext) => {
    const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
    
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      daysSinceProposal: 7,
      proposalContextSummary: "Propuesta enviada para solución de automatización",
      senderName: userName,
      senderCompany: companyName,
    };
    
    const response = await fetch('/api/ai/follow-up-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar recordatorio de seguimiento');
    }
    
    return await response.json();
  },

  // Negotiation Tactics
  suggestNegotiationTactics: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      proposalValue: 50000,
      previousProposalContext: "Propuesta inicial enviada con todas las características",
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/negotiation-tactics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al sugerir tácticas de negociación');
    }
    
    return await response.json();
  },

  // Negotiation Strategy
  developNegotiationStrategy: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      negotiationContext: "Cliente interesado pero con dudas sobre el precio",
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/negotiation-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al desarrollar estrategia de negociación');
    }
    
    return await response.json();
  },

  // Counter Offer
  generateCounterOfferMessage: async ({ user, lead }: HandlerContext) => {
    const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
    
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      originalOfferValue: 50000,
      counterOfferValue: 45000,
      justificationContext: "Ajuste de precio por volumen de compra",
      senderName: userName,
      senderCompany: companyName,
    };
    
    const response = await fetch('/api/ai/counter-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar contraoferta');
    }
    
    return await response.json();
  },

  // Recovery Strategy
  generateRecoveryStrategy: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      lossReason: "Optaron por competidor con precio más bajo",
      timesSinceLoss: 30,
      competitorWhoWon: "Competidor local",
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/recovery-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar estrategia de recuperación');
    }
    
    return await response.json();
  },

  // Loss Analysis
  analyzeLossReasons: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      lossReason: "Precio demasiado alto para su presupuesto",
      competitorWhoWon: "Competidor con solución más básica",
      proposalValue: 5000,
      salesCycleLength: 45,
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/loss-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al analizar razones de pérdida');
    }
    
    return await response.json();
  },

  // Competitor Report
  generateCompetitorReport: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
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
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/competitor-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar informe de competidores');
    }
    
    return await response.json();
  },

  // Thank You Message
  generateThankYouMessage: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
    
    const input = {
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
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/thank-you', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar mensaje de agradecimiento');
    }
    
    return await response.json();
  },

  // Cross-sell Opportunities
  generateCrossSellOpportunities: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
      leadId: lead.id,
      leadName: lead.name,
      businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
      leadStage: lead.stage,
      leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      currentSolution: userProducts.length > 0 ? userProducts[0].name : "Solución implementada",
      purchaseValue: 5000,
      implementationStatus: "Exitosa - 3 meses de uso",
      satisfactionLevel: "Alta",
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/cross-sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar oportunidades de venta cruzada');
    }
    
    return await response.json();
  },

  // Customer Survey
  generateCustomerSurvey: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
    
    const input = {
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
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/customer-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al generar encuesta de cliente');
    }
    
    return await response.json();
  },

  // Risk Assessment
  assessRiskFactors: async ({ user, lead, userProducts = [] }: HandlerContext) => {
    const input = {
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
      userProducts: userProducts.length > 0 ? userProducts : undefined,
    };
    
    const response = await fetch('/api/ai/risk-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Error al evaluar factores de riesgo');
    }
    
    return await response.json();
  },
};