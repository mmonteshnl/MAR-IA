"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles } from 'lucide-react';
import { useMemo, useCallback, useEffect } from 'react';
import { ActionResult } from '@/types/actionResult';
import { useFormattedContent } from '@/hooks/useFormattedContent';
import { useModalState } from '@/hooks/useModalState';
import { QuickActions } from './components/QuickActions';
import { ContentView } from './components/ContentView';
import { WhatsAppSection } from './components/WhatsAppSection';
import { isFieldMissing } from '@/lib/leads-utils';

interface LeadActionResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionResult: ActionResult;
  currentActionType: string | null;
  onClose: () => void;
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
      case 'welcome': return <BrainCircuit className="h-5 w-5" />;
      case 'evaluate': return <Lightbulb className="h-5 w-5" />;
      case 'recommend': return <PackageSearch className="h-5 w-5" />;
      case 'solution-email': return <Mail className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-100 text-gray-600">
              {modalIcon}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {modalTitle}
              </DialogTitle>
              <Badge variant="secondary" className="text-xs mt-1 bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Generado con IA
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          {actionResult && actionResult.error ? (
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
          ) : (
            <div className="space-y-4">
              <QuickActions
                copied={state.copied}
                isEditing={state.isEditing}
                onCopy={() => handleCopy()}
                onStartEdit={handleStartEdit}
              />

              <ContentView
                actionResult={actionResult}
                isEditing={state.isEditing}
                editedContent={state.editedContent}
                onContentChange={actions.updateContent}
                onSave={actions.saveEdit}
                onCancel={actions.cancelEdit}
              />

              {actionResult && !actionResult.error && (
                <WhatsAppSection
                  hasPhoneNumber={Boolean(hasPhoneNumber)}
                  isEditing={state.isEditing}
                  editedContent={state.editedContent}
                  isSending={state.isSending}
                  justSent={state.justSent}
                  currentLeadName={currentLead?.name}
                  onSend={handleWhatsAppSend}
                  onCopy={handleCopy}
                />
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="px-6">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}