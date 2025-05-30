"use client";

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileUp, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/types';

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (leads: Lead[]) => void;
  formatXmlLeads?: (input: any) => Promise<any>;
  formatCsvLeads?: (input: any) => Promise<any>;
}

export default function LeadImportDialog({
  open,
  onOpenChange,
  onImportComplete,
  formatXmlLeads,
  formatCsvLeads
}: LeadImportDialogProps) {
  const { toast } = useToast();
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImport(true);
    setImportError(null);

    try {
      const text = await file.text();
      const isXml = file.name.toLowerCase().endsWith('.xml');
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      if (!isXml && !isCsv) {
        throw new Error("Por favor selecciona un archivo XML o CSV");
      }

      let processedLeads: Lead[] = [];

      if (isXml && formatXmlLeads) {
        const result = await formatXmlLeads({ xmlContent: text });
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.leads || result.leads.length === 0) {
          throw new Error("No se encontraron leads válidos en el archivo XML");
        }

        processedLeads = result.leads.map((lead: any) => ({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uid: '',
          placeId: null,
          name: lead.name || 'Sin nombre',
          address: lead.location || null,
          phone: lead.contact || null,
          website: lead.website || null,
          email: lead.email || null,
          company: lead.company || lead.name || null,
          notes: lead.notes || null,
          businessType: lead.category || null,
          source: 'xml_import_ia',
          stage: lead.suggestedStage || 'Nuevo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          images: []
        }));
      } else if (isCsv && formatCsvLeads) {
        const result = await formatCsvLeads({ csvContent: text });
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.leads || result.leads.length === 0) {
          throw new Error("No se encontraron leads válidos en el archivo CSV");
        }

        processedLeads = result.leads.map((lead: any) => ({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uid: '',
          placeId: null,
          name: lead.name || 'Sin nombre',
          address: lead.location || null,
          phone: lead.contact || null,
          website: lead.website || null,
          email: lead.email || null,
          company: lead.company || lead.name || null,
          notes: lead.notes || null,
          businessType: lead.category || null,
          source: 'csv_import_ia',
          stage: lead.suggestedStage || 'Nuevo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          images: []
        }));
      }

      if (processedLeads.length > 0) {
        onImportComplete(processedLeads);
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${processedLeads.length} leads correctamente.`
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error importing file:", error);
      setImportError(error.message || "Error al procesar el archivo");
      toast({
        title: "Error en la importación",
        description: error.message || "No se pudo procesar el archivo",
        variant: "destructive"
      });
    } finally {
      setIsProcessingImport(false);
      // Reset input
      event.target.value = '';
    }
  }, [formatXmlLeads, formatCsvLeads, onImportComplete, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Selecciona un archivo XML o CSV con información de leads para importar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
            <label htmlFor="file-import" className="cursor-pointer">
              <Button 
                variant="outline" 
                disabled={isProcessingImport}
                asChild
              >
                <span>
                  {isProcessingImport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Seleccionar archivo"
                  )}
                </span>
              </Button>
            </label>
            <input
              id="file-import"
              type="file"
              accept=".xml,.csv"
              onChange={handleFileImport}
              className="hidden"
              disabled={isProcessingImport}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formatos soportados: XML, CSV
            </p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Los leads importados se procesarán con IA para extraer y formatear la información automáticamente.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isProcessingImport}>
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}