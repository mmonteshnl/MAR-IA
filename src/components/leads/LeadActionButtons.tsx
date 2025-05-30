"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles, Loader2 } from 'lucide-react';
import type { Lead } from '@/types';
import { isFieldMissing } from '@/lib/leads-utils';

interface LeadActionButtonsProps {
  lead: Lead;
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  currentActionLead: Lead | null;
  isActionLoading: boolean;
  currentActionType: string | null;
}

export default function LeadActionButtons({
  lead,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  currentActionLead,
  isActionLoading,
  currentActionType,
}: LeadActionButtonsProps) {
  const isContactDisabled = isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email);
  const isCurrentlyProcessing = currentActionLead?.id === lead.id && isActionLoading;

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* AI Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            IA
          </Badge>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isCurrentlyProcessing && currentActionType === 'welcome' ? "default" : "ghost"}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onGenerateWelcomeMessage(lead);
                }}
                disabled={isContactDisabled || isCurrentlyProcessing}
                className={`text-xs h-8 px-2.5 transition-all duration-200 ${
                  isCurrentlyProcessing && currentActionType === 'welcome' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md' 
                    : 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'
                }`}
              >
                {isCurrentlyProcessing && currentActionType === 'welcome' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BrainCircuit className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white text-xs">
              <p>Generar mensaje de bienvenida con IA</p>
              {isContactDisabled && <p className="text-orange-300 text-[10px]">Sin datos de contacto</p>}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isCurrentlyProcessing && currentActionType === 'evaluate' ? "default" : "ghost"}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEvaluateBusiness(lead);
                }}
                disabled={isCurrentlyProcessing}
                className={`text-xs h-8 px-2.5 transition-all duration-200 ${
                  isCurrentlyProcessing && currentActionType === 'evaluate' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' 
                    : 'hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                }`}
              >
                {isCurrentlyProcessing && currentActionType === 'evaluate' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white text-xs">
              <p>Evaluar oportunidades de negocio</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isCurrentlyProcessing && currentActionType === 'recommend' ? "default" : "ghost"}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onGenerateSalesRecommendations(lead);
                }}
                disabled={isCurrentlyProcessing}
                className={`text-xs h-8 px-2.5 transition-all duration-200 ${
                  isCurrentlyProcessing && currentActionType === 'recommend' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                    : 'hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                }`}
              >
                {isCurrentlyProcessing && currentActionType === 'recommend' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PackageSearch className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white text-xs">
              <p>Recomendar productos personalizados</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isCurrentlyProcessing && currentActionType === 'solution-email' ? "default" : "ghost"}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onGenerateSolutionEmail(lead);
                }}
                disabled={isCurrentlyProcessing}
                className={`text-xs h-8 px-2.5 transition-all duration-200 ${
                  isCurrentlyProcessing && currentActionType === 'solution-email' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                    : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                }`}
              >
                {isCurrentlyProcessing && currentActionType === 'solution-email' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white text-xs">
              <p>Generar email de configuración TPV</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}