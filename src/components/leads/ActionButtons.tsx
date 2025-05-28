'use client';

import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, Loader2, MailIconLucide, MessageSquareText, Clock, 
  FileText, Lightbulb, AlertCircle, Users, Bell, Handshake, 
  Heart, PackageSearch, ClipboardList, Repeat 
} from 'lucide-react';
import type { Lead } from '@/types';
import type { ActionType } from '@/types/ai-actions';

interface ActionButtonsProps {
  lead: Lead;
  isActionLoading: boolean;
  currentActionLead: Lead | null;
  currentActionType: ActionType | null;
  onWelcomeMessage: (lead: Lead) => void;
  onContactStrategy: (lead: Lead) => void;
  onBestFollowUpTimes: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onSalesRecommendations: (lead: Lead) => void;
  onFollowUpEmail: (lead: Lead) => void;
  onObjectionHandling: (lead: Lead) => void;
  onProposalSummary: (lead: Lead) => void;
  onCompetitorAnalysis: (lead: Lead) => void;
  onFollowUpReminder: (lead: Lead) => void;
  onNegotiationTactics: (lead: Lead) => void;
  onNegotiationStrategy: (lead: Lead) => void;
  onCounterOffer: (lead: Lead) => void;
  onThankYou: (lead: Lead) => void;
  onCrossSell: (lead: Lead) => void;
  onCustomerSurvey: (lead: Lead) => void;
  onWinBack: (lead: Lead) => void;
  onLossAnalysis: (lead: Lead) => void;
  onCompetitorReport: (lead: Lead) => void;
}

export function ActionButtons({
  lead,
  isActionLoading,
  currentActionLead,
  currentActionType,
  onWelcomeMessage,
  onContactStrategy,
  onBestFollowUpTimes,
  onEvaluateBusiness,
  onSalesRecommendations,
  onFollowUpEmail,
  onObjectionHandling,
  onProposalSummary,
  onCompetitorAnalysis,
  onFollowUpReminder,
  onNegotiationTactics,
  onNegotiationStrategy,
  onCounterOffer,
  onThankYou,
  onCrossSell,
  onCustomerSurvey,
  onWinBack,
  onLossAnalysis,
  onCompetitorReport,
}: ActionButtonsProps) {
  const buttons = [];

  const createButton = (
    key: string,
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    actionType: ActionType
  ) => (
    <Button
      key={key}
      variant="ghost"
      size="sm"
      className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={isActionLoading && currentActionLead?.id === lead.id}
    >
      {isActionLoading && currentActionLead?.id === lead.id && currentActionType === actionType ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        icon
      )}{" "}
      {label}
    </Button>
  );

  switch (lead.stage) {
    case "Nuevo":
      buttons.push(
        createButton("welcome", "Bienvenida", <MailIconLucide className="h-3.5 w-3.5 mr-1.5" />, 
          () => onWelcomeMessage(lead), "Mensaje de Bienvenida")
      );
      buttons.push(
        createButton("contactStrategy", "Estrategias de Contacto", <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />,
          () => onContactStrategy(lead), "Estrategias de Contacto")
      );
      buttons.push(
        createButton("bestFollowUpTimes", "Mejores Momentos", <Clock className="h-3.5 w-3.5 mr-1.5" />,
          () => onBestFollowUpTimes(lead), "Mejores Momentos")
      );
      break;

    case "Contactado":
      buttons.push(
        createButton("evaluate", "Evaluar", <FileText className="h-3.5 w-3.5 mr-1.5" />,
          () => onEvaluateBusiness(lead), "Evaluación de Negocio")
      );
      buttons.push(
        createButton("recommend", "Recomendar Productos", <Lightbulb className="h-3.5 w-3.5 mr-1.5" />,
          () => onSalesRecommendations(lead), "Recomendaciones de Venta")
      );
      buttons.push(
        createButton("followUpEmail", "Seguimiento", <MailIconLucide className="h-3.5 w-3.5 mr-1.5" />,
          () => onFollowUpEmail(lead), "Email de Seguimiento")
      );
      buttons.push(
        createButton("objectionHandling", "Manejo de Objeciones", <AlertCircle className="h-3.5 w-3.5 mr-1.5" />,
          () => onObjectionHandling(lead), "Manejo de Objeciones")
      );
      break;

    case "Calificado":
      buttons.push(
        createButton("evaluate", "Evaluar", <FileText className="h-3.5 w-3.5 mr-1.5" />,
          () => onEvaluateBusiness(lead), "Evaluación de Negocio")
      );
      buttons.push(
        createButton("recommend", "Recomendar Productos", <Lightbulb className="h-3.5 w-3.5 mr-1.5" />,
          () => onSalesRecommendations(lead), "Recomendaciones de Venta")
      );
      buttons.push(
        createButton("proposalSummary", "Resumen Propuesta", <FileText className="h-3.5 w-3.5 mr-1.5" />,
          () => onProposalSummary(lead), "Resumen Propuesta")
      );
      buttons.push(
        createButton("competitorAnalysis", "Análisis Competidores", <Users className="h-3.5 w-3.5 mr-1.5" />,
          () => onCompetitorAnalysis(lead), "Análisis Competidores")
      );
      break;

    case "Propuesta Enviada":
      buttons.push(
        createButton("recommend", "Recomendar Productos", <Lightbulb className="h-3.5 w-3.5 mr-1.5" />,
          () => onSalesRecommendations(lead), "Recomendaciones de Venta")
      );
      buttons.push(
        createButton("followUpReminder", "Recordatorio Seguimiento", <Bell className="h-3.5 w-3.5 mr-1.5" />,
          () => onFollowUpReminder(lead), "Recordatorio Seguimiento")
      );
      buttons.push(
        createButton("negotiationTactics", "Tácticas Negociación", <Handshake className="h-3.5 w-3.5 mr-1.5" />,
          () => onNegotiationTactics(lead), "Tácticas Negociación")
      );
      break;

    case "Negociación":
      buttons.push(
        createButton("negotiationStrategy", "Estrategia Negociación", <Handshake className="h-3.5 w-3.5 mr-1.5" />,
          () => onNegotiationStrategy(lead), "Estrategia Negociación")
      );
      buttons.push(
        createButton("counterOffer", "Contraoferta", <FileText className="h-3.5 w-3.5 mr-1.5" />,
          () => onCounterOffer(lead), "Contraoferta")
      );
      buttons.push(
        createButton("riskAssessment", "Evaluación Riesgos", <AlertCircle className="h-3.5 w-3.5 mr-1.5" />,
          () => {}, "Evaluación de Riesgos") // TODO: Implement
      );
      break;

    case "Ganado":
      buttons.push(
        createButton("thankYou", "Agradecimiento", <Heart className="h-3.5 w-3.5 mr-1.5" />,
          () => onThankYou(lead), "Mensaje de Agradecimiento")
      );
      buttons.push(
        createButton("crossSell", "Venta Cruzada", <PackageSearch className="h-3.5 w-3.5 mr-1.5" />,
          () => onCrossSell(lead), "Venta Cruzada")
      );
      buttons.push(
        createButton("customerSurvey", "Encuesta Cliente", <ClipboardList className="h-3.5 w-3.5 mr-1.5" />,
          () => onCustomerSurvey(lead), "Encuesta de Satisfacción")
      );
      break;

    case "Perdido":
      buttons.push(
        createButton("winBack", "Recuperación", <Repeat className="h-3.5 w-3.5 mr-1.5" />,
          () => onWinBack(lead), "Campaña de Recuperación")
      );
      buttons.push(
        createButton("lossAnalysis", "Análisis Pérdidas", <AlertCircle className="h-3.5 w-3.5 mr-1.5" />,
          () => onLossAnalysis(lead), "Análisis de Pérdida")
      );
      buttons.push(
        createButton("competitorReport", "Informe Competidores", <Users className="h-3.5 w-3.5 mr-1.5" />,
          () => onCompetitorReport(lead), "Informe de Competidores")
      );
      break;

    default:
      break;
  }

  return buttons.length > 0 ? (
    <div className="mt-3 pt-2 border-t border-border/30">
      <div className="flex items-center text-xs text-muted-foreground mb-1.5">
        <BrainCircuit className="h-3.5 w-3.5 mr-1.5 text-primary" />
        Acciones Sugeridas con IA:
      </div>
      <div className="flex flex-wrap gap-1">
        {buttons.map((btn) => (
          <div key={btn.key} className="flex-grow shadow-sm w-full rounded-sm">
            {btn}
          </div>
        ))}
      </div>
    </div>
  ) : null;
}