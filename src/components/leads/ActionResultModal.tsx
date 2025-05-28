'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Zap, MailIconLucide } from 'lucide-react';
import type { Lead } from '@/types';
import type { ActionResult, ActionType } from '@/types/ai-actions';

interface ActionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentActionLead: Lead | null;
  currentActionType: ActionType | null;
  actionResult: ActionResult;
  isLoading: boolean;
}

export function ActionResultModal({
  isOpen,
  onClose,
  currentActionLead,
  currentActionType,
  actionResult,
  isLoading
}: ActionResultModalProps) {
  if (!currentActionLead) return null;

  let title = `Resultado para ${currentActionLead.name}`;
  let content: React.ReactNode = <p>Cargando...</p>;

  if (isLoading) {
    content = (
      <div className="flex justify-center items-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-3 text-primary">Generando sugerencia...</span>
      </div>
    );
  } else if (actionResult && 'error' in actionResult && actionResult.error) {
    title = `Error - ${currentActionType || 'Acción de IA'}`;
    content = <p className="text-destructive">{actionResult.error}</p>;
  } else if (actionResult) {
    title = `${currentActionType || 'Resultado de IA'} para ${currentActionLead.name}`;
    
    if (currentActionType === "Mensaje de Bienvenida" && 'message' in actionResult) {
      content = <p className="whitespace-pre-wrap text-sm text-foreground">{actionResult.message}</p>;
    } 
    
    else if (currentActionType === "Evaluación de Negocio" && 'evaluation' in actionResult) {
      content = <p className="whitespace-pre-wrap text-sm text-foreground">{actionResult.evaluation}</p>;
    } 
    
    else if (currentActionType === "Recomendaciones de Venta" && 'recommendations' in actionResult && Array.isArray(actionResult.recommendations)) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <p>La IA sugiere los siguientes productos/servicios para <strong>{currentActionLead.name}</strong>:</p>
          {(actionResult.recommendations as { area: string, suggestion: string }[]).length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {(actionResult.recommendations as { area: string, suggestion: string }[]).map((rec, index) => (
                <li key={index}>
                  <strong>{rec.area}:</strong> {rec.suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">La IA no encontró recomendaciones específicas de tu catálogo para este lead.</p>
          )}
        </div>
      );
    } 
    
    else if (currentActionType === "Estrategias de Contacto" && 'suggestedChannels' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div>
            <h4 className="font-semibold mb-2">Canales de Contacto Sugeridos:</h4>
            <ul className="space-y-2">
              {(actionResult.suggestedChannels as { channel: string, reasoning: string }[]).map((ch, index) => (
                <li key={index} className="flex flex-col space-y-1">
                  <span className="font-medium">{ch.channel}</span>
                  <span className="text-muted-foreground text-xs">{ch.reasoning}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Puntos Clave de Conversación:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {('keyTalkingPoints' in actionResult && Array.isArray(actionResult.keyTalkingPoints) ? actionResult.keyTalkingPoints as string[] : []).map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          
          {'openingLineSuggestion' in actionResult && actionResult.openingLineSuggestion && (
            <div>
              <h4 className="font-semibold mb-2">Sugerencia de Apertura:</h4>
              <p className="bg-muted/30 p-2 rounded text-xs italic">{actionResult.openingLineSuggestion}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2">Objetivo Principal del Contacto:</h4>
            <p className="text-primary font-medium">{'primaryGoalOfContact' in actionResult ? actionResult.primaryGoalOfContact : ''}</p>
          </div>
        </div>
      );
    } 
    
    else if (currentActionType === "Mejores Momentos" && 'recommendations' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div>
            <h4 className="font-semibold mb-2">Mejores Momentos para Seguimiento:</h4>
            <div className="space-y-3">
              {(actionResult.recommendations as { dayOfWeek: string, timeSlotLocal: string, reasoning: string }[]).map((rec, index) => (
                <div key={index} className="bg-muted/20 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{rec.dayOfWeek} - {rec.timeSlotLocal}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
          
          {'generalTips' in actionResult && actionResult.generalTips && Array.isArray(actionResult.generalTips) && actionResult.generalTips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Consejos Generales:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {(actionResult.generalTips as string[]).map((tip, index) => (
                  <li key={index} className="text-xs">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } 
    
    else if (currentActionType === "Email de Seguimiento" && 'subject' in actionResult && 'body' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div>
            <h4 className="font-semibold mb-2">Asunto del Email:</h4>
            <p className="bg-muted/20 p-2 rounded-md font-medium">{actionResult.subject}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Cuerpo del Email:</h4>
            <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap text-xs">
              {actionResult.body}
            </div>
          </div>
          
          {'customizationPoints' in actionResult && actionResult.customizationPoints && Array.isArray(actionResult.customizationPoints) && actionResult.customizationPoints.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Sugerencias de Personalización:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {(actionResult.customizationPoints as string[]).map((point, index) => (
                  <li key={index} className="text-xs text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } 
    
    else if (currentActionType === "Manejo de Objeciones" && 'objectionCategory' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-primary/10 p-3 rounded-md">
            <p className="font-semibold">Categoría de Objeción: <span className="text-primary">{actionResult.objectionCategory}</span></p>
          </div>
          
          {'empathyStatement' in actionResult && actionResult.empathyStatement && (
            <div>
              <h4 className="font-semibold mb-2">Declaración de Empatía:</h4>
              <p className="bg-muted/20 p-3 rounded-md italic">&ldquo;{actionResult.empathyStatement}&rdquo;</p>
            </div>
          )}
          
          {'suggestedResponses' in actionResult && Array.isArray(actionResult.suggestedResponses) && (
            <div>
              <h4 className="font-semibold mb-2">Estrategias de Respuesta:</h4>
              <div className="space-y-3">
                {(actionResult.suggestedResponses as any[]).map((response, index) => (
                  <div key={index} className="border border-border/50 rounded-md p-3">
                    <h5 className="font-semibold text-primary mb-2">{response.strategyName}</h5>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium mb-1">Puntos clave:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {response.responsePoints.map((point: string, idx: number) => (
                            <li key={idx} className="text-xs">{point}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {response.pros && response.pros.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1">Ventajas:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {response.pros.map((pro: string, idx: number) => (
                              <li key={idx} className="text-xs text-green-600">{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {response.consOrWatchouts && response.consOrWatchouts.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-600 mb-1">Consideraciones:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {response.consOrWatchouts.map((con: string, idx: number) => (
                              <li key={idx} className="text-xs text-orange-600">{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {'clarifyingQuestions' in actionResult && actionResult.clarifyingQuestions && Array.isArray(actionResult.clarifyingQuestions) && actionResult.clarifyingQuestions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Preguntas de Aclaración:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {(actionResult.clarifyingQuestions as string[]).map((question, index) => (
                  <li key={index} className="text-xs">{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } 
    
    else if (currentActionType === "Resumen Propuesta" && 'summaryTitle' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-primary/10 p-3 rounded-md">
            <h3 className="font-bold text-lg text-primary">{actionResult.summaryTitle}</h3>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Resumen Ejecutivo:</h4>
            <p className="bg-muted/20 p-3 rounded-md leading-relaxed">
              {actionResult.executiveSummary}
            </p>
          </div>
          
          {'keyBenefitsAlignedWithNeeds' in actionResult && Array.isArray(actionResult.keyBenefitsAlignedWithNeeds) && (
            <div>
              <h4 className="font-semibold mb-2">Beneficios Clave Alineados con Necesidades:</h4>
              <div className="space-y-2">
                {(actionResult.keyBenefitsAlignedWithNeeds as any[]).map((item, index) => (
                  <div key={index} className="flex gap-2 bg-muted/10 p-2 rounded-md">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Necesidad:</p>
                      <p className="text-sm">{item.need}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary">Beneficio:</p>
                      <p className="text-sm">{item.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {'uniqueSellingPropositionHighlight' in actionResult && actionResult.uniqueSellingPropositionHighlight && (
            <div>
              <h4 className="font-semibold mb-2">Propuesta de Valor Única:</h4>
              <p className="bg-primary/20 p-3 rounded-md border-l-4 border-primary">
                {actionResult.uniqueSellingPropositionHighlight}
              </p>
            </div>
          )}
          
          {'suggestedNextStepFromProposal' in actionResult && (
            <div>
              <h4 className="font-semibold mb-2">Próximo Paso Sugerido:</h4>
              <div className="bg-primary text-primary-foreground p-3 rounded-md flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <p className="font-medium">{actionResult.suggestedNextStepFromProposal}</p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    else if (currentActionType === "Análisis Competidores" && 'comparativeDimensions' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          {'leadBusinessFocus' in actionResult && actionResult.leadBusinessFocus && (
            <div>
              <h4 className="font-semibold mb-2">Enfoque del Negocio:</h4>
              <p className="bg-muted/20 p-2 rounded-md">{actionResult.leadBusinessFocus}</p>
            </div>
          )}
          
          {'potentialCompetitorTypes' in actionResult && Array.isArray(actionResult.potentialCompetitorTypes) && actionResult.potentialCompetitorTypes.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tipos de Competidores Potenciales:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {(actionResult.potentialCompetitorTypes as string[]).map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2">Dimensiones Comparativas:</h4>
            <div className="space-y-3">
              {(actionResult.comparativeDimensions as any[]).map((dim, index) => (
                <div key={index} className="bg-muted/10 p-3 rounded-md">
                  <h5 className="font-semibold text-primary mb-2">{dim.dimension}</h5>
                  {dim.userStrengthSuggestion && (
                    <p className="text-sm mb-2">{dim.userStrengthSuggestion}</p>
                  )}
                  {dim.questionForLead && (
                    <p className="text-xs text-muted-foreground italic">Pregunta sugerida: "{dim.questionForLead}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {'generalStrategyTip' in actionResult && actionResult.generalStrategyTip && (
            <div>
              <h4 className="font-semibold mb-2">Consejo Estratégico:</h4>
              <p className="bg-primary/10 p-3 rounded-md">{actionResult.generalStrategyTip}</p>
            </div>
          )}
        </div>
      );
    }
    
    else if (currentActionType === "Recordatorio Seguimiento" && 'reminderTypeSuggestion' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-primary/10 p-3 rounded-md">
            <p className="font-semibold">Tipo de Recordatorio: <span className="text-primary">{actionResult.reminderTypeSuggestion}</span></p>
          </div>
          
          {'messageSubjectOrTitle' in actionResult && actionResult.messageSubjectOrTitle && (
            <div>
              <h4 className="font-semibold mb-2">Asunto/Tema:</h4>
              <p className="bg-muted/20 p-2 rounded-md">{actionResult.messageSubjectOrTitle}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2">Mensaje/Puntos Clave:</h4>
            <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap">
              {actionResult.messageBodyOrScriptPoints}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Tono Recomendado:</h4>
            <p className="text-primary font-medium">{actionResult.tone}</p>
          </div>
        </div>
      );
    }
    
    else if (currentActionType === "Tácticas Negociación" && 'primaryNegotiationGoal' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-primary/10 p-3 rounded-md">
            <h4 className="font-semibold">Objetivo Principal:</h4>
            <p className="text-primary">{actionResult.primaryNegotiationGoal}</p>
          </div>
          
          {'suggestedTactics' in actionResult && Array.isArray(actionResult.suggestedTactics) && (
            <div>
              <h4 className="font-semibold mb-2">Tácticas Sugeridas:</h4>
              <div className="space-y-3">
                {(actionResult.suggestedTactics as any[]).map((tactic, index) => (
                  <div key={index} className="border border-border/50 rounded-md p-3">
                    <h5 className="font-semibold text-primary mb-2">{tactic.tacticName}</h5>
                    <p className="text-sm mb-2">{tactic.description}</p>
                    {tactic.examplePhrasing && (
                      <p className="bg-muted/20 p-2 rounded text-xs italic mb-2">
                        "Ejemplo: {tactic.examplePhrasing}"
                      </p>
                    )}
                    {tactic.potentialRisksOrConsiderations && (
                      <p className="text-xs text-orange-600">
                        ⚠️ {tactic.potentialRisksOrConsiderations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {'keyPreparationPoints' in actionResult && Array.isArray(actionResult.keyPreparationPoints) && actionResult.keyPreparationPoints.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Puntos de Preparación:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {(actionResult.keyPreparationPoints as string[]).map((point, index) => (
                  <li key={index} className="text-xs">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    else if (currentActionType === "Estrategia Negociación" && 'overarchingStrategyName' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          <div className="bg-primary/10 p-3 rounded-md">
            <h3 className="font-bold text-lg text-primary">{actionResult.overarchingStrategyName}</h3>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Justificación:</h4>
            <p className="bg-muted/20 p-3 rounded-md">{actionResult.strategyRationale}</p>
          </div>
          
          {'keyPillarsOfStrategy' in actionResult && Array.isArray(actionResult.keyPillarsOfStrategy) && (
            <div>
              <h4 className="font-semibold mb-2">Pilares Clave:</h4>
              <div className="space-y-2">
                {(actionResult.keyPillarsOfStrategy as any[]).map((pillar, index) => (
                  <div key={index} className="bg-muted/10 p-3 rounded-md">
                    <h5 className="font-semibold text-primary mb-1">{pillar.pillarName}</h5>
                    <p className="text-sm">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {'batnaSuggestion' in actionResult && actionResult.batnaSuggestion && (
            <div>
              <h4 className="font-semibold mb-2">BATNA (Mejor Alternativa):</h4>
              <p className="bg-primary/20 p-3 rounded-md">{actionResult.batnaSuggestion}</p>
            </div>
          )}
          
          {'walkAwayPointConsideration' in actionResult && actionResult.walkAwayPointConsideration && (
            <div>
              <h4 className="font-semibold mb-2">Punto de Retirada:</h4>
              <p className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-md text-orange-800 dark:text-orange-200">
                {actionResult.walkAwayPointConsideration}
              </p>
            </div>
          )}
        </div>
      );
    }
    
    else if (currentActionType === "Contraoferta" && 'counterOfferPoints' in actionResult) {
      content = (
        <div className="space-y-3 text-sm text-foreground">
          {'subject' in actionResult && actionResult.subject && (
            <div>
              <h4 className="font-semibold mb-2">Asunto:</h4>
              <p className="bg-muted/20 p-2 rounded-md">{actionResult.subject}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2">Apertura:</h4>
            <p className="bg-muted/20 p-3 rounded-md">{actionResult.openingStatement}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Puntos de Contraoferta:</h4>
            <div className="space-y-2">
              {(actionResult.counterOfferPoints as any[]).map((point, index) => (
                <div key={index} className="bg-muted/10 p-3 rounded-md">
                  {point.originalTerm && (
                    <p className="text-xs text-muted-foreground line-through mb-1">{point.originalTerm}</p>
                  )}
                  <p className="font-medium text-primary">{point.proposedTerm}</p>
                  {point.briefRationale && (
                    <p className="text-xs mt-1">{point.briefRationale}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {'valuePropositionReinforcement' in actionResult && actionResult.valuePropositionReinforcement && (
            <div>
              <h4 className="font-semibold mb-2">Propuesta de Valor:</h4>
              <p className="bg-primary/10 p-3 rounded-md">{actionResult.valuePropositionReinforcement}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-2">Llamada a la Acción:</h4>
            <p className="bg-primary text-primary-foreground p-3 rounded-md">{actionResult.callToAction}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tono:</span>
            <span className="font-medium">{actionResult.tone}</span>
          </div>
        </div>
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border rounded-[var(--radius)]">
        <DialogHeader>
          <DialogTitle className="text-lg text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {content}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="border-muted-foreground text-muted-foreground hover:bg-muted/30 rounded-[var(--radius)]">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}