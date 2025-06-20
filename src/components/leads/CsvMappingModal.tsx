"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle, AlertCircle, FileText, ArrowUpCircle } from 'lucide-react';
import Papa from 'papaparse';

// Available fields for mapping to UnifiedLead
const UNIFIED_LEAD_FIELDS = [
  { value: '', label: 'No asignar', description: 'Ignorar esta columna' },
  { value: 'fullName', label: 'Nombre Completo', description: 'Nombre completo del lead' },
  { value: 'email', label: 'Email', description: 'Correo electrónico' },
  { value: 'phone', label: 'Teléfono', description: 'Número telefónico' },
  { value: 'company', label: 'Empresa', description: 'Nombre de la empresa' },
  { value: 'address', label: 'Dirección', description: 'Dirección completa' },
  { value: 'website', label: 'Sitio Web', description: 'URL del sitio web' },
  { value: 'businessType', label: 'Tipo de Negocio', description: 'Categoría del negocio' },
  { value: 'stage', label: 'Etapa', description: 'Etapa en el pipeline de ventas' },
  { value: 'estimatedValue', label: 'Valor Estimado', description: 'Valor monetario estimado' },
  { value: 'notes', label: 'Notas', description: 'Notas adicionales' },
  { value: 'leadScore', label: 'Puntuación', description: 'Puntuación del lead (0-100)' },
] as const;

interface CsvPreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface CsvMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  organizationId: string;
  onComplete: (result: { success: boolean; saved: number; total: number; errors?: string[] }) => void;
}

export default function CsvMappingModal({ 
  open, 
  onOpenChange, 
  file, 
  organizationId, 
  onComplete 
}: CsvMappingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [csvPreview, setCsvPreview] = useState<CsvPreviewData | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load CSV preview when file changes
  useEffect(() => {
    if (file && open) {
      loadCsvPreview();
    }
  }, [file, open]);

  const loadCsvPreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      
      const parseResult = Papa.parse(text, {
        header: false,
        preview: 10, // Only parse first 10 rows for preview
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        toast({
          title: "Error al leer el archivo CSV",
          description: "El archivo no tiene un formato CSV válido.",
          variant: "destructive"
        });
        return;
      }

      const data = parseResult.data as string[][];
      
      if (data.length === 0) {
        toast({
          title: "Archivo vacío",
          description: "El archivo CSV no contiene datos.",
          variant: "destructive"
        });
        return;
      }

      // Get full row count
      const fullParseResult = Papa.parse(text, {
        header: false,
        skipEmptyLines: true
      });

      const headers = data[0] || [];
      const rows = data.slice(1);

      setCsvPreview({
        headers: headers.map(h => h?.toString().trim() || ''),
        rows,
        totalRows: fullParseResult.data.length - 1 // Subtract header
      });

      // Initialize mappings (empty by default)
      const initialMappings: Record<string, string> = {};
      headers.forEach(header => {
        if (header?.toString().trim()) {
          initialMappings[header.toString().trim()] = '';
        }
      });
      setMappings(initialMappings);

    } catch (error: any) {
      console.error('Error loading CSV:', error);
      toast({
        title: "Error al cargar el archivo",
        description: error.message || "No se pudo leer el archivo CSV.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (csvHeader: string, unifiedField: string) => {
    setMappings(prev => ({
      ...prev,
      [csvHeader]: unifiedField
    }));
  };

  const validateMappings = (): boolean => {
    const errors: string[] = [];
    const usedFields = new Set<string>();

    // Check for required mappings
    const hasName = Object.values(mappings).includes('fullName');
    const hasEmail = Object.values(mappings).includes('email');
    
    if (!hasName && !hasEmail) {
      errors.push('Debe asignar al menos un campo de "Nombre Completo" o "Email"');
    }

    // Check for duplicate mappings
    for (const [csvHeader, unifiedField] of Object.entries(mappings)) {
      if (unifiedField && unifiedField !== '') {
        if (usedFields.has(unifiedField)) {
          errors.push(`El campo "${unifiedField}" está asignado a múltiples columnas`);
        }
        usedFields.add(unifiedField);
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleImport = async () => {
    if (!file || !csvPreview) return;

    if (!validateMappings()) {
      toast({
        title: "Error de validación",
        description: "Corrija los errores de mapeo antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    
    try {
      // Filter out empty mappings
      const filteredMappings = Object.fromEntries(
        Object.entries(mappings).filter(([_, value]) => value && value !== '')
      );

      // Create form data
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('mappings', JSON.stringify(filteredMappings));
      formData.append('organizationId', organizationId);

      // Get auth token
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      const token = await user.getIdToken();

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error en la importación');
      }

      toast({
        title: "Importación exitosa",
        description: `${result.saved} leads importados correctamente de ${result.total} filas procesadas.`
      });

      onComplete({
        success: true,
        saved: result.saved,
        total: result.total,
        errors: result.errors
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error en la importación",
        description: error.message || "No se pudo completar la importación.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const getMappedCount = () => {
    return Object.values(mappings).filter(value => value && value !== '').length;
  };

  const resetMappings = () => {
    const resetMappings: Record<string, string> = {};
    Object.keys(mappings).forEach(header => {
      resetMappings[header] = '';
    });
    setMappings(resetMappings);
  };

  if (!csvPreview && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cargando archivo CSV...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analizando archivo...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!csvPreview) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mapear Campos del CSV
          </DialogTitle>
          <DialogDescription>
            Asigne cada columna de su archivo CSV a un campo de Mar-IA. Los campos no asignados serán ignorados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Resumen del Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Archivo</p>
                  <p className="font-semibold">{file?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de filas</p>
                  <p className="font-semibold">{csvPreview.totalRows.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Columnas</p>
                  <p className="font-semibold">{csvPreview.headers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campos mapeados</p>
                  <p className="font-semibold">{getMappedCount()} / {csvPreview.headers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Errores de Validación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Mapping Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mapeo de Campos</CardTitle>
                <Button variant="outline" size="sm" onClick={resetMappings}>
                  Limpiar Asignaciones
                </Button>
              </div>
              <CardDescription>
                Vista previa de las primeras 5 filas de su archivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Columna CSV</TableHead>
                      <TableHead className="w-[250px]">Asignar a...</TableHead>
                      <TableHead>Vista Previa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.headers.map((header, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{header || `Columna ${index + 1}`}</div>
                            <div className="text-xs text-muted-foreground">
                              Columna {String.fromCharCode(65 + index)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mappings[header] || ''}
                            onValueChange={(value) => handleMappingChange(header, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar campo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIFIED_LEAD_FIELDS.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  <div>
                                    <div className="font-medium">{field.label}</div>
                                    <div className="text-xs text-muted-foreground">{field.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {mappings[header] && mappings[header] !== '' && (
                            <Badge variant="secondary" className="mt-1">
                              {UNIFIED_LEAD_FIELDS.find(f => f.value === mappings[header])?.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {csvPreview.rows.slice(0, 3).map((row, rowIndex) => (
                              <div key={rowIndex} className="text-sm bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                                {row[index] || <span className="text-muted-foreground italic">vacío</span>}
                              </div>
                            ))}
                            {csvPreview.rows.length > 3 && (
                              <div className="text-xs text-muted-foreground italic">
                                +{csvPreview.rows.length - 3} filas más...
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            {getMappedCount()} campos asignados
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importing || getMappedCount() === 0}
              className="bg-primary"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Confirmar e Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}