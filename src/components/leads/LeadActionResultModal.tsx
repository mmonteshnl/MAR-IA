"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles, Bot, Target, Check } from 'lucide-react';
import { useMemo, useCallback, useEffect } from 'react';
import { ActionResult } from '@/types/actionResult';
import { useFormattedContent } from '@/hooks/useFormattedContent';
import { useModalState } from '@/hooks/useModalState';
import { QuickActions } from './components/QuickActions';
import { ContentView } from './components/ContentView';
import { isFieldMissing } from '@/lib/leads-utils';

interface LeadActionResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionResult: ActionResult;
  currentActionType: string | null;
  onClose: () => void;
  isActionLoading?: boolean;
  currentLead?: {
    name: string;
    phone?: string | null;
  } | null;
}

export default function LeadActionResultModal({
  open,
  onOpenChange,
  actionResult,
  currentActionType,
  onClose,
  isActionLoading = false,
  currentLead
}: LeadActionResultModalProps) {
  const { state, actions } = useModalState();
  const contentText = useFormattedContent(actionResult);

  // Memoized values
  const hasPhoneNumber = useMemo(() => 
    Boolean(currentLead?.phone && !isFieldMissing(currentLead.phone)), 
    [currentLead?.phone]
  );

  const modalIcon = useMemo(() => {
    switch (currentActionType) {
      case 'welcome': return <Bot className="h-5 w-5 text-blue-600" />;
      case 'evaluate': return <Target className="h-5 w-5 text-green-600" />;
      case 'recommend': return <Target className="h-5 w-5 text-orange-600" />;
      case 'solution-email': return <Mail className="h-5 w-5 text-purple-600" />;
      default: return <Sparkles className="h-5 w-5 text-blue-600" />;
    }
  }, [currentActionType]);

  const modalTitle = useMemo(() => {
    switch (currentActionType) {
      case 'welcome': return 'Mensaje de Bienvenida Generado';
      case 'evaluate': return 'Evaluación del Negocio';
      case 'recommend': return 'Recomendaciones de Productos';
      case 'solution-email': return 'Email de Configuración TPV';
      default: return 'Resultado Generado';
    }
  }, [currentActionType]);

  // Helper function to resolve text content
  const resolveText = useCallback((custom?: string) => custom ?? contentText, [contentText]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      actions.resetAll();
    }
    onOpenChange(isOpen);
  }, [onClose, onOpenChange, actions]);

  const handleCopy = useCallback(async (customText?: string) => {
    const textToCopy = resolveText(customText);
    if (!textToCopy) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      actions.copySuccess();
      setTimeout(() => actions.copyReset(), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [resolveText, actions]);
  
  const handleWhatsAppSend = useCallback(async (customText?: string) => {
    if (!hasPhoneNumber) {
      alert('❌ No hay número de teléfono disponible para este contacto');
      return;
    }
    
    const textToSend = resolveText(customText);
    if (!textToSend) {
      alert('❌ No hay contenido para enviar');
      return;
    }
    
    actions.startSending();
    
    try {
      // Simular delay para mostrar animación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpiar el número de teléfono
      const cleanPhone = currentLead!.phone!.replace(/\D/g, '');
      
      // Asegurar que el número tenga el formato correcto
      let phoneNumber = cleanPhone;
      if (phoneNumber.length === 10 && !phoneNumber.startsWith('52')) {
        phoneNumber = '52' + phoneNumber;
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
        phoneNumber = phoneNumber;
      } else if (phoneNumber.length === 12 && phoneNumber.startsWith('52')) {
        phoneNumber = phoneNumber;
      }
      
      // Codificar el mensaje
      const message = encodeURIComponent(textToSend);
      
      // Crear el enlace de WhatsApp
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      actions.sendSuccess();
      setTimeout(() => actions.sendReset(), 3000);
      
    } catch (error) {
      console.error('Error al generar enlace de WhatsApp:', error);
      alert('❌ Error al generar el enlace de WhatsApp');
    }
  }, [hasPhoneNumber, resolveText, actions, currentLead]);

  const handleStartEdit = useCallback(() => {
    actions.startEdit(contentText);
  }, [actions, contentText]);

  // Reset timers on unmount
  useEffect(() => {
    return () => {
      actions.resetAll();
    };
  }, [actions]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        {actionResult && actionResult.error ? (
          <>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Error al generar contenido
              </DialogTitle>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al generar contenido</AlertTitle>
                <AlertDescription className="mt-2">
                  {actionResult.error}
                  {actionResult.error.includes('Status: 500') && (
                    <div className="mt-2 text-sm">
                      <p>Esto suele indicar un problema con el servidor de IA.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/ai/test');
                            const result = await response.json();
                            console.log('AI Test result:', result);
                            alert(response.ok ? 'Conexión AI OK ✅' : `Error AI: ${result.error}`);
                          } catch (error) {
                            console.error('Test failed:', error);
                            alert('Error al probar conexión AI ❌');
                          }
                        }}
                      >
                        Probar Conexión AI
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="p-3 rounded-full bg-white shadow-sm border border-gray-200">
                  {modalIcon}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {modalTitle}
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">Resultado impulsado por inteligencia artificial</p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full font-medium shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  IA
                </div>
              </div>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              {!state.isEditing && (
                <QuickActions
                  copied={state.copied}
                  isEditing={state.isEditing}
                  onCopy={() => handleCopy()}
                  onStartEdit={handleStartEdit}
                />
              )}

              <ContentView
                actionResult={actionResult}
                isEditing={state.isEditing}
                editedContent={state.editedContent}
                onContentChange={actions.updateContent}
                onSave={actions.saveEdit}
                onCancel={actions.cancelEdit}
                onCopy={handleCopy}
                onWhatsAppSend={handleWhatsAppSend}
                hasPhoneNumber={hasPhoneNumber}
                isSending={state.isSending}
                isLoading={isActionLoading && !actionResult}
              />

              {actionResult && !actionResult.error && hasPhoneNumber && !state.isEditing && (
                <div className="p-4 bg-white border-2 border-[#25D366] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#25D366] rounded-lg">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Enviar por WhatsApp</h4>
                        <p className="text-sm text-gray-600">
                          {state.isSending ? 'Preparando mensaje...' : `Enviar a ${currentLead?.name}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleWhatsAppSend()}
                      disabled={state.isSending || state.justSent}
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6"
                      aria-label="Enviar mensaje por WhatsApp"
                    >
                      {state.isSending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Enviando...
                        </div>
                      ) : state.justSent ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Enviado
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
                          </svg>
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <DialogFooter className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Bot className="h-3 w-3" />
              <span>Contenido generado con IA</span>
            </div>
            <div className="flex gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="px-6 hover:bg-gray-50">
                  Cerrar
                </Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  // Call the API to generate a new evaluation
                  const response = await fetch('/api/ai/evaluate-business', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ leadName: currentLead?.name }), // Pass necessary data
                  });

                  if (response.ok) {
                    const newEvaluation = await response.json();
                    console.log('New evaluation generated:', newEvaluation);
                    // Optionally update the modal state or display the new evaluation
                  } else {
                    const errorData = await response.json();
                    console.error('Error generating new evaluation:', errorData.error);
                    alert('Error generating new evaluation: ' + errorData.error);
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Generar Nueva Evaluación
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
