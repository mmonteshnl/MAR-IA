# Instrucciones para actualizar page.tsx

## 1. Actualizar las importaciones al inicio del archivo:

```typescript
// Remover las importaciones de AI flows individuales y reemplazar con:
import type { ActionResult, ActionType } from '@/types/ai-actions';
import { ActionButtons } from '@/components/leads/ActionButtons';
import { ActionResultModal } from '@/components/leads/ActionResultModal';
import * as aiHandlers from '@/lib/lead-ai-handlers';

// Agregar importaciones para los nuevos flujos de IA:
import { generateCompetitorAnalysisInsights, type GenerateCompetitorAnalysisInsightsInput, type GenerateCompetitorAnalysisInsightsOutput } from '@/ai/flows/generateCompetitorAnalysisInsightsFlow';
import { generateFollowUpReminderMessage, type GenerateFollowUpReminderMessageInput, type GenerateFollowUpReminderMessageOutput } from '@/ai/flows/generateFollowUpReminderMessageFlow';
import { suggestNegotiationTactics, type SuggestNegotiationTacticsInput, type SuggestNegotiationTacticsOutput } from '@/ai/flows/suggestNegotiationTacticsFlow';
import { developNegotiationStrategy, type DevelopNegotiationStrategyInput, type DevelopNegotiationStrategyOutput } from '@/ai/flows/developNegotiationStrategyFlow';
import { generateCounterOfferMessage, type GenerateCounterOfferMessageInput, type GenerateCounterOfferMessageOutput } from '@/ai/flows/generateCounterOfferMessageFlow';
```

## 2. Actualizar el tipo ActionResult:

```typescript
// Remover la definición actual de ActionResult y usar la importada de types/ai-actions.ts
```

## 3. Actualizar el estado currentActionType:

```typescript
const [currentActionType, setCurrentActionType] = useState<ActionType | null>(null);
```

## 4. Actualizar todos los handlers de AI:

Reemplazar cada handler (handleGenerateWelcomeMessage, handleEvaluateBusiness, etc.) con versiones que usen el contexto centralizado:

```typescript
const handleGenerateWelcomeMessage = async (lead: Lead) => {
  if (!user) {
    toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
    return;
  }
  setCurrentActionLead(lead);
  setIsActionLoading(true);
  setActionResult(null);
  setCurrentActionType("Mensaje de Bienvenida");

  try {
    const result = await aiHandlers.handleGenerateWelcomeMessage({ user, lead });
    setActionResult(result);
  } catch (error: any) {
    setActionResult({ error: error.message || "Error al generar mensaje. Asegúrate de que la API Key de Gemini esté configurada." });
  } finally {
    setIsActionLoading(false);
    setIsActionResultModalOpen(true);
  }
};
```

## 5. Agregar los nuevos handlers:

```typescript
const handleGenerateCompetitorAnalysisInsights = async (lead: Lead) => {
  if (!user) {
    toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
    return;
  }
  setCurrentActionLead(lead);
  setIsActionLoading(true);
  setActionResult(null);
  setCurrentActionType("Análisis Competidores");

  try {
    const result = await aiHandlers.handleGenerateCompetitorAnalysisInsights({ user, lead, userProducts });
    setActionResult(result);
  } catch (error: any) {
    setActionResult({ error: error.message || "Error al generar análisis de competidores." });
  } finally {
    setIsActionLoading(false);
    setIsActionResultModalOpen(true);
  }
};

// Similar para los otros nuevos handlers...
```

## 6. Reemplazar renderActionButtons:

```typescript
// Remover la función renderActionButtons completa y reemplazar su uso con:
<ActionButtons
  lead={lead}
  isActionLoading={isActionLoading}
  currentActionLead={currentActionLead}
  currentActionType={currentActionType}
  onWelcomeMessage={handleGenerateWelcomeMessage}
  onContactStrategy={handleGenerateContactStrategy}
  onBestFollowUpTimes={handleSuggestBestFollowUpTimes}
  onEvaluateBusiness={handleEvaluateBusiness}
  onSalesRecommendations={handleGenerateSalesRecommendations}
  onFollowUpEmail={handleGenerateFollowUpEmail}
  onObjectionHandling={handleGenerateObjectionHandlingGuidance}
  onProposalSummary={handleGenerateProposalSummary}
  onCompetitorAnalysis={handleGenerateCompetitorAnalysisInsights}
  onFollowUpReminder={handleGenerateFollowUpReminderMessage}
  onNegotiationTactics={handleSuggestNegotiationTactics}
  onNegotiationStrategy={handleDevelopNegotiationStrategy}
  onCounterOffer={handleGenerateCounterOfferMessage}
  onThankYou={() => toast({ title: "Próximamente" })}
  onCrossSell={() => toast({ title: "Próximamente" })}
  onCustomerSurvey={() => toast({ title: "Próximamente" })}
  onWinBack={() => toast({ title: "Próximamente" })}
  onLossAnalysis={() => toast({ title: "Próximamente" })}
  onCompetitorReport={() => toast({ title: "Próximamente" })}
/>
```

## 7. Reemplazar renderActionResultModal:

```typescript
// Remover la función renderActionResultModal completa y reemplazar su uso con:
<ActionResultModal
  isOpen={isActionResultModalOpen}
  onClose={() => {
    setActionResult(null);
    setCurrentActionLead(null);
    setCurrentActionType(null);
    setIsActionResultModalOpen(false);
  }}
  currentActionLead={currentActionLead}
  currentActionType={currentActionType}
  actionResult={actionResult}
  isLoading={isActionLoading}
/>
```

## 8. Actualizar las llamadas a renderActionButtons:

Buscar todas las instancias de `{renderActionButtons(lead)}` y reemplazar con el componente ActionButtons con todos los props necesarios.

## 9. Actualizar la llamada a renderActionResultModal:

Buscar `{renderActionResultModal()}` al final del componente y reemplazar con el componente ActionResultModal.