import type { Lead } from '@/types';
import { ValuationConfig, LeadValuation } from '@/types/valuation';

export const calculateLeadValuation = (lead: Lead, config: ValuationConfig): LeadValuation => {
  // 1. Valor base según tipo de negocio
  const businessTypeKey = lead.businessType?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const baseValue = config.businessTypeWeights[businessTypeKey] || config.businessTypeWeights.default;

  // 2. Multiplicador por etapa
  const stageMultiplier = config.stageMultipliers[lead.stage] || 0.1;

  // 3. Bonificaciones por completitud de datos
  let completenessBonus = 0;
  const dataCompletenessFacts: Array<{factor: string, value: number}> = [];
  
  if (lead.phone && lead.phone.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasPhone;
    dataCompletenessFacts.push({ factor: 'Teléfono', value: config.dataCompletenessWeights.hasPhone });
  }
  if (lead.email && lead.email.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasEmail;
    dataCompletenessFacts.push({ factor: 'Email', value: config.dataCompletenessWeights.hasEmail });
  }
  if (lead.website && lead.website.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasWebsite;
    dataCompletenessFacts.push({ factor: 'Sitio Web', value: config.dataCompletenessWeights.hasWebsite });
  }
  if (lead.address && lead.address.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasAddress;
    dataCompletenessFacts.push({ factor: 'Dirección', value: config.dataCompletenessWeights.hasAddress });
  }
  if (lead.businessType && lead.businessType.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasBusinessType;
    dataCompletenessFacts.push({ factor: 'Tipo de Negocio', value: config.dataCompletenessWeights.hasBusinessType });
  }

  // 4. Bonificaciones por interacciones de IA
  let aiBonus = 0;
  const aiInteractionFacts: Array<{factor: string, value: number}> = [];
  
  // Detectar si se han ejecutado acciones de IA (simulado por ahora)
  if (lead.phone || lead.email) {
    aiBonus += config.aiInteractionWeights.hasWelcomeMessage;
    aiInteractionFacts.push({ factor: 'Mensaje de Bienvenida', value: config.aiInteractionWeights.hasWelcomeMessage });
  }
  if (lead.businessType) {
    aiBonus += config.aiInteractionWeights.hasEvaluation;
    aiInteractionFacts.push({ factor: 'Evaluación de Negocio', value: config.aiInteractionWeights.hasEvaluation });
  }

  // 5. Cálculo final
  const adjustedBaseValue = baseValue + completenessBonus + aiBonus;
  const totalValue = Math.round(adjustedBaseValue * stageMultiplier);

  return {
    baseValue,
    stageMultiplier,
    completenessBonus,
    aiBonus,
    totalValue,
    formattedValue: formatCurrency(totalValue),
    breakdown: {
      businessType: lead.businessType || 'Sin especificar',
      businessTypeValue: baseValue,
      stageValue: stageMultiplier,
      dataCompleteness: dataCompletenessFacts,
      aiInteractions: aiInteractionFacts
    }
  };
};

export const calculateStageTotal = (leads: Lead[], stage: string, config: ValuationConfig): number => {
  return leads
    .filter(lead => lead.stage === stage)
    .reduce((total, lead) => total + calculateLeadValuation(lead, config).totalValue, 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Función para obtener el color del valor según la cantidad
export const getValueColor = (value: number): string => {
  if (value >= 1000) return 'text-green-600';
  if (value >= 500) return 'text-blue-600';
  if (value >= 200) return 'text-orange-600';
  return 'text-gray-600';
};

// Función para obtener indicador visual del valor
export const getValueIndicator = (value: number): string => {
  if (value >= 1000) return '🔥'; // Alta valor
  if (value >= 500) return '⭐'; // Buen valor
  if (value >= 200) return '📈'; // Valor moderado
  return '💡'; // Valor básico
};