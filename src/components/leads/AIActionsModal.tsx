"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles, Loader2, AlertTriangle, Calculator, Building2, Zap, X, CheckCircle, Clock, Database, Workflow } from 'lucide-react';
import type { ExtendedLead as Lead } from '@/types';
import { isFieldMissing } from '@/lib/leads-utils';
import { AICacheManager } from '@/lib/ai-cache-manager';
import { useManualFlows } from '@/hooks/useManualFlows';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';

interface AIActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  onGenerateQuote: (lead: Lead) => void;
  onGenerateBillingQuote?: (lead: Lead) => void;
  onGenerateHybridQuote?: (lead: Lead) => void;
  currentActionLead: Lead | null;
  isActionLoading: boolean;
  currentActionType: string | null;
}

export default function AIActionsModal({
  open,
  onOpenChange,
  lead,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  onGenerateQuote,
  onGenerateBillingQuote,
  onGenerateHybridQuote,
  currentActionLead,
  isActionLoading,
  currentActionType,
}: AIActionsModalProps) {
  
  // Estado para animaciones de entrada
  const [isVisible, setIsVisible] = useState(false);
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  
  // Hook para obtener flujos manuales
  const { manualFlows, isLoading: flowsLoading, error: flowsError, runFlow } = useManualFlows();

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setCompletedAction(null);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // Efecto para mostrar acción completada
  useEffect(() => {
    if (!isActionLoading && currentActionType) {
      setCompletedAction(currentActionType);
      const timer = setTimeout(() => setCompletedAction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [isActionLoading, currentActionType]);

  // Información de cache - debe estar antes del return condicional
  const cacheInfo = useMemo(() => {
    return lead ? AICacheManager.getCacheInfo(lead.aiContent) : null;
  }, [lead?.aiContent]);

  if (!lead) return null;

  const isContactDisabled = isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email);
  const isCurrentlyProcessing = currentActionLead?.id === lead.id && isActionLoading;

  // Mapeo de tipos de contenido a IDs de acciones
  const contentTypeToActionId = {
    welcomeMessage: 'welcome',
    businessEvaluation: 'evaluate',
    salesRecommendations: 'recommend',
    solutionEmail: 'solution-email',
    quotation: 'quote'
  };

  // Función para verificar si una acción tiene contenido en cache
  const hasValidCache = (actionId: string) => {
    const contentType = Object.keys(contentTypeToActionId).find(
      key => contentTypeToActionId[key as keyof typeof contentTypeToActionId] === actionId
    );
    if (!contentType) return false;
    
    return cacheInfo.cachedItems.some(
      item => item.type === contentType && item.fromCache && item.isValid
    );
  };

  const actions = [
    {
      id: 'welcome',
      label: 'Mensaje de Bienvenida',
      description: 'Genera mensaje personalizado de primer contacto',
      icon: BrainCircuit,
      onClick: onGenerateWelcomeMessage,
      disabled: isContactDisabled || isCurrentlyProcessing,
      color: 'text-blue-400',
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      hoverGradient: 'hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500',
      category: 'communication',
      priority: 'high',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'evaluate',
      label: 'Evaluar Negocio',
      description: 'Analiza potencial y oportunidades del lead',
      icon: Lightbulb,
      onClick: onEvaluateBusiness,
      disabled: isCurrentlyProcessing,
      color: 'text-amber-400',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      hoverGradient: 'hover:from-amber-400 hover:via-orange-400 hover:to-red-400',
      category: 'analysis',
      priority: 'high',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'recommend',
      label: 'Recomendaciones de Ventas',
      description: 'Sugiere productos específicos para el negocio',
      icon: PackageSearch,
      onClick: onGenerateSalesRecommendations,
      disabled: isCurrentlyProcessing,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      hoverGradient: 'hover:from-emerald-400 hover:via-green-400 hover:to-teal-400',
      category: 'sales',
      priority: 'medium',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'solution-email',
      label: 'Email de Configuración TPV',
      description: 'Crea email técnico para configuración',
      icon: Mail,
      onClick: onGenerateSolutionEmail,
      disabled: isCurrentlyProcessing,
      color: 'text-purple-400',
      gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
      hoverGradient: 'hover:from-purple-400 hover:via-violet-400 hover:to-fuchsia-400',
      category: 'communication',
      priority: 'medium',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'quote',
      label: 'Generar Cotización con IA',
      description: 'Crea cotización inteligente personalizada',
      icon: Calculator,
      onClick: onGenerateQuote,
      disabled: isCurrentlyProcessing,
      color: 'text-orange-400',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      hoverGradient: 'hover:from-orange-400 hover:via-red-400 hover:to-pink-400',
      category: 'sales',
      priority: 'high',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'billing-quote',
      label: 'Cotización PandaDoc',
      description: 'Genera cotización usando PandaDoc',
      icon: Building2,
      onClick: onGenerateBillingQuote || (() => {}),
      disabled: !onGenerateBillingQuote || isCurrentlyProcessing,
      color: 'text-cyan-400',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      hoverGradient: 'hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400',
      category: 'documentation',
      priority: 'medium',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    },
    {
      id: 'hybrid-quote',
      label: 'Cotización Híbrida IA+PandaDoc',
      description: 'Combina análisis IA con documentos PandaDoc',
      icon: Zap,
      onClick: onGenerateHybridQuote || (() => {}),
      disabled: !onGenerateHybridQuote || isCurrentlyProcessing,
      color: 'text-pink-400',
      gradient: 'from-pink-500 via-purple-500 to-violet-600',
      hoverGradient: 'hover:from-pink-400 hover:via-purple-400 hover:to-violet-500',
      category: 'advanced',
      priority: 'high',
      availableStages: ['Nuevo','Contactado','Calificado','Propuesta Enviada','Negociación','Ganado','Perdido','Prospecto','Interesado','Propuesta','Vendido']
    }
  ];

  const availableActions = actions.filter(action => action.availableStages.includes(lead.stage));
  
  // Agrupar acciones por prioridad para mejor organización
  const highPriorityActions = availableActions.filter(action => action.priority === 'high');
  const mediumPriorityActions = availableActions.filter(action => action.priority === 'medium');

  const getCurrentAction = () => {
    return actions.find(action => action.id === currentActionType);
  };

  const currentAction = getCurrentAction();

  const handleActionClick = (action: typeof actions[0]) => {
    if (!action.disabled) {
      console.log(`🎯 AIActionsModal: Ejecutando acción ${action.id} para lead ${lead.name}`);
      action.onClick(lead);
      
      // Cerrar este modal después de ejecutar la acción
      console.log(`🚪 AIActionsModal: Cerrando modal de acciones IA`);
      onOpenChange(false);
    }
  };

  const handleRunFlow = async (flowId: string, flowName: string) => {
    try {
      const leadData = {
        leadName: lead.name || 'Lead sin nombre',
        leadEmail: lead.email || '',
        leadPhone: lead.phone || '',
        leadWebsite: lead.website || '',
        leadStage: lead.stage || 'Nuevo',
        leadSource: lead.source || '',
        leadIndustry: lead.business_type || '',
        leadAddress: lead.address || '',
        // Añadir más campos según necesites
        products: [] // Esto puede ser configurado dinámicamente
      };

      toast({
        title: 'Ejecutando flujo',
        description: `Iniciando "${flowName}" para ${lead.name}`,
      });

      const result = await runFlow(flowId, leadData);
      
      toast({
        title: 'Flujo iniciado',
        description: `El flujo "${flowName}" se está ejecutando. ID: ${result.executionId}`,
      });
      
      // Cerrar modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error running flow:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al ejecutar el flujo',
        variant: 'destructive'
      });
    }
  };

  // Componente para botón de acción con layout perfectamente alineado
  const ActionButton = ({ action, index }: { action: typeof actions[0], index: number }) => {
    const Icon = action.icon;
    const isProcessing = isCurrentlyProcessing && currentActionType === action.id;
    const isCompleted = completedAction === action.id;
    const hasCachedContent = hasValidCache(action.id);
    
    return (
      <div
        className={`transform transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <Button
          variant="outline"
          className={`
            group relative w-full h-24 p-0 overflow-hidden transition-all duration-300 ease-out
            border-gray-600/50 hover:border-gray-400/50 backdrop-blur-sm rounded-lg
            ${action.disabled 
              ? 'opacity-40 cursor-not-allowed' 
              : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20'
            }
            ${isProcessing ? 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20' : ''}
            ${isCompleted ? 'ring-2 ring-green-400/50 shadow-lg shadow-green-500/20' : ''}
          `}
          disabled={action.disabled}
          onClick={(e) => {
            e.stopPropagation(); // Evitar propagación de eventos
            handleActionClick(action);
          }}
        >
          {/* Fondo con gradiente animado */}
          <div className={`
            absolute inset-0 bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80
            group-hover:from-gray-700/90 group-hover:via-gray-600/70 group-hover:to-gray-700/90
            transition-all duration-300 rounded-lg
          `} />
          
          {/* Efecto de brillo en hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 
            group-hover:opacity-10 transition-opacity duration-300 rounded-lg
          `} />
          
          {/* Contenido perfectamente alineado */}
          <div className="relative flex items-center gap-4 w-full h-full px-4 py-3">
            {/* Icono con dimensiones fijas */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} 
              shadow-lg transition-all duration-300 group-hover:scale-110 flex items-center justify-center
              ${isProcessing ? 'animate-pulse' : ''}
              ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600' : ''}
            `}>
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : isCompleted ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <Icon className="h-6 w-6 text-white" />
              )}
              
              {/* Efecto de pulso para acciones activas */}
              {isProcessing && (
                <div className={`
                  absolute inset-0 rounded-xl bg-gradient-to-br ${action.gradient}
                  animate-ping opacity-75
                `} />
              )}
            </div>
            
            {/* Información de la acción con altura fija */}
            <div className="flex-1 min-w-0 text-left flex flex-col justify-center h-full">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`
                  font-semibold text-sm transition-colors duration-200 truncate
                  ${isProcessing ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-white'}
                  group-hover:text-gray-100
                `}>
                  {action.label}
                </h3>
                
                {/* Badge de prioridad */}
                {action.priority === 'high' && (
                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30 flex-shrink-0">
                    Alta
                  </Badge>
                )}
                
                {/* Badge de contenido cacheado */}
                {hasCachedContent && (
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border-green-500/30 flex-shrink-0">
                    <Database className="h-3 w-3 mr-1" />
                    Guardado
                  </Badge>
                )}
              </div>
              
              <p className={`
                text-xs leading-relaxed transition-colors duration-200 line-clamp-2
                ${isProcessing ? 'text-blue-200' : isCompleted ? 'text-green-200' : 'text-gray-300'}
                group-hover:text-gray-200
              `}>
                {action.description}
              </p>
              
              {/* Indicador de estado en la parte inferior */}
              <div className="mt-2 min-h-[16px] flex items-center">
                {isProcessing && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-blue-300 font-medium">Procesando...</span>
                  </div>
                )}
                
                {isCompleted && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-300 font-medium">¡Completado!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl">
        {/* Header mejorado con mejor espaciado */}
        <DialogHeader className="space-y-4 pb-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icono principal con animación */}
              <div className={`
                relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 
                shadow-2xl transition-all duration-500
                ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
              `}>
                <Sparkles className="h-7 w-7 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-pulse opacity-50" />
              </div>
              
              <div className="space-y-2">
                <DialogTitle className={`
                  text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 
                  bg-clip-text text-transparent transition-all duration-500
                  ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
                `}>
                  Acciones de Inteligencia Artificial
                </DialogTitle>
                <DialogDescription className={`
                  text-gray-300 flex items-center gap-2 transition-all duration-500 delay-100
                  ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
                `}>
                  <span>Optimiza la gestión del lead:</span>
                  <Badge variant="outline" className="text-blue-300 border-blue-400/50 bg-blue-500/10 font-medium">
                    {lead.name}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido principal con scroll mejorado y mejor padding */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar px-1">
          <div className="space-y-6 py-2">
          {/* Warning mejorado para datos de contacto limitados */}
          {isContactDisabled && (
            <div className={`
              p-4 bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-red-900/30 
              border border-amber-700/50 rounded-xl backdrop-blur-sm
              transition-all duration-500 delay-200
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-300 mb-1">Datos de contacto limitados</h4>
                  <p className="text-sm text-amber-200 leading-relaxed">
                    Algunas acciones pueden estar deshabilitadas por falta de información de contacto. 
                    Considera actualizar el perfil del lead.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de procesamiento global mejorado */}
          {isCurrentlyProcessing && currentAction && (
            <div className={`
              p-5 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 
              border border-blue-700/50 rounded-xl backdrop-blur-sm relative overflow-hidden
            `}>
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              
              <div className="relative flex items-center gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-1">Procesando con Inteligencia Artificial</h4>
                  <p className="text-sm text-blue-200">
                    <span className="font-medium">{currentAction.label}</span> en progreso para 
                    <span className="font-medium text-blue-100 ml-1">{lead.name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sección de flujos automatizados */}
          <div className={`
            p-4 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 
            border border-purple-700/50 rounded-xl backdrop-blur-sm
            transition-all duration-500 delay-300
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
                  <Workflow className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300">Flujos Automatizados</h4>
                  <p className="text-sm text-purple-200">
                    {manualFlows.length > 0 
                      ? 'Ejecuta workflows personalizados' 
                      : 'Crea tu primer flujo automatizado'
                    }
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-purple-300 border-purple-400/50 bg-purple-500/10">
                {flowsError ? 'Error' : flowsLoading ? 'Cargando...' : `${manualFlows.length} disponibles`}
              </Badge>
            </div>
            
            {flowsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-red-400 mb-2">❌ Error al cargar flujos</div>
                  <div className="text-sm text-red-300">{flowsError}</div>
                </div>
              </div>
            ) : flowsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                  <span className="text-purple-300">Cargando flujos...</span>
                </div>
              </div>
            ) : manualFlows.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {manualFlows.map((flow) => (
                  <Button
                    key={flow.id}
                    variant="outline"
                    size="sm"
                    className="border-purple-600/50 text-purple-300 hover:bg-purple-700/20 hover:text-purple-200 hover:border-purple-500/70"
                    onClick={() => handleRunFlow(flow.id, flow.name)}
                  >
                    <Workflow className="h-3 w-3 mr-2" />
                    {flow.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                    <Workflow className="h-8 w-8 text-purple-400" />
                  </div>
                  <h5 className="font-medium text-purple-300 mb-2">No hay flujos automatizados</h5>
                  <p className="text-sm text-purple-200/80 mb-4">
                    Crea flujos personalizados para automatizar tareas repetitivas
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-600/50 text-purple-300 hover:bg-purple-700/20 hover:text-purple-200 hover:border-purple-500/70"
                    onClick={() => {
                      window.open('/conex', '_blank');
                    }}
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    Abrir Panel Conex
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-200 text-xs"
                      onClick={() => {
                        window.open('/conex/connections', '_blank');
                      }}
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Conexiones
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-200 text-xs"
                      onClick={() => {
                        window.open('/conex/flows', '_blank');
                      }}
                    >
                      <Workflow className="h-3 w-3 mr-1" />
                      Flujos
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    💡 <strong>Tip:</strong> Crea una conexión a PandaDoc primero, luego diseña un flujo para generar cotizaciones automáticamente
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grid de acciones perfectamente organizado */}
          <div className="space-y-6">
            {/* Acciones de alta prioridad */}
            {highPriorityActions.length > 0 && (
              <div className="space-y-4">
                <div className={`
                  flex items-center gap-3 transition-all duration-500 delay-300
                  ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
                `}>
                  <div className="h-px bg-gradient-to-r from-amber-500 to-orange-500 flex-1"></div>
                  <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider px-3">
                    Acciones Recomendadas
                  </h3>
                  <div className="h-px bg-gradient-to-l from-amber-500 to-orange-500 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
                  {highPriorityActions.map((action, index) => (
                    <ActionButton key={action.id} action={action} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Acciones de prioridad media */}
            {mediumPriorityActions.length > 0 && (
              <div className="space-y-4">
                <div className={`
                  flex items-center gap-3 transition-all duration-500 delay-400
                  ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
                `}>
                  <div className="h-px bg-gradient-to-r from-gray-500 to-gray-400 flex-1"></div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider px-3">
                    Acciones Adicionales
                  </h3>
                  <div className="h-px bg-gradient-to-l from-gray-500 to-gray-400 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
                  {mediumPriorityActions.map((action, index) => (
                    <ActionButton 
                      key={action.id} 
                      action={action} 
                      index={highPriorityActions.length + index} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Footer perfectamente alineado */}
        <div className={`
          flex justify-between items-center pt-6 border-t border-gray-700/50
          transition-all duration-500 delay-500
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium">Potenciado por IA Avanzada</span>
            </div>
            <div className="h-4 w-px bg-gray-600"></div>
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600 bg-gray-800/50">
              {availableActions.length} acciones disponibles
            </Badge>
            
            {/* Información de cache */}
            {cacheInfo.totalCachedItems > 0 && (
              <>
                <div className="h-4 w-px bg-gray-600"></div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Database className="h-3 w-3" />
                  <span>{cacheInfo.totalCachedItems} contenidos guardados</span>
                </div>
              </>
            )}
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="
              border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white 
              transition-all duration-200 hover:scale-105 px-6
            "
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Estilos CSS personalizados para el scrollbar y layout (agregar a globals.css)
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.auto-rows-fr {
  grid-auto-rows: 1fr;
}
*/