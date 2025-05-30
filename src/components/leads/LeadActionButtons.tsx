"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
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

  const actions = [
    {
      id: 'welcome',
      label: 'Mensaje de Bienvenida',
      description: 'Genera mensaje personalizado de primer contacto',
      icon: BrainCircuit,
      onClick: onGenerateWelcomeMessage,
      disabled: isContactDisabled || isCurrentlyProcessing,
      color: 'text-blue-400',
    },
    {
      id: 'evaluate',
      label: 'Evaluar Negocio',
      description: 'Analiza potencial y oportunidades',
      icon: Lightbulb,
      onClick: onEvaluateBusiness,
      disabled: isCurrentlyProcessing,
      color: 'text-amber-400',
    },
    {
      id: 'recommend',
      label: 'Recomendaciones',
      description: 'Sugiere productos específicos',
      icon: PackageSearch,
      onClick: onGenerateSalesRecommendations,
      disabled: isCurrentlyProcessing,
      color: 'text-green-400',
    },
    {
      id: 'solution-email',
      label: 'Email de Configuración',
      description: 'Crea email técnico TPV',
      icon: Mail,
      onClick: onGenerateSolutionEmail,
      disabled: isCurrentlyProcessing,
      color: 'text-purple-400',
    }
  ];

  const getCurrentAction = () => {
    return actions.find(action => action.id === currentActionType);
  };

  const currentAction = getCurrentAction();

  return (
    <div className="space-y-2">
     
      
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full h-8 text-xs transition-all duration-200 ${
              isCurrentlyProcessing 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md' 
                : 'hover:bg-gray-700'
            }`}
            disabled={isCurrentlyProcessing && !currentAction}
          >
            {isCurrentlyProcessing && currentAction ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="truncate">{currentAction.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                 {/* AI Badge */}
  
                <Sparkles className="  text-blue-700 border-purple-200 h-3 w-3" />
                <span className="flex-1 truncate">Acciones IA</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="center" className="w-56">
          {/* Warning for disabled contact */}
          {isContactDisabled && (
            <>
              <div className="px-3 py-2 text-xs text-amber-800 bg-amber-100 border border-amber-300 rounded-sm mx-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-700" />
                  <span>Sin datos de contacto disponibles</span>
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {actions.map((action) => {
            const Icon = action.icon;
            const isProcessing = isCurrentlyProcessing && currentActionType === action.id;
            
            return (
              <DropdownMenuItem
                key={action.id}
                className={`cursor-pointer transition-colors ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                } ${isProcessing ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!action.disabled) {
                    action.onClick(lead);
                  }
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Icon className={`h-4 w-4 ${action.color}`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${isProcessing ? 'text-blue-900' : 'text-white'}`}>
                      {action.label}
                    </div>
                    <div className={`text-xs ${isProcessing ? 'text-blue-700' : 'text-gray-300'}`}>
                      {action.description}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          {/* Processing indicator */}
          {isCurrentlyProcessing && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2 text-xs text-blue-900 bg-blue-100 rounded-sm mx-1 mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span>Procesando con IA...</span>
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}