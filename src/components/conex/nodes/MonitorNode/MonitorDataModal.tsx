import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Eye, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MonitorDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  formattedOutput?: string;
  outputFormat?: 'json' | 'table' | 'list';
  nodeName?: string;
  timestamp?: string;
}

export function MonitorDataModal({
  isOpen,
  onClose,
  data,
  formattedOutput,
  outputFormat = 'json',
  nodeName = 'Monitor',
  timestamp,
}: MonitorDataModalProps) {
  /**
   * Utilidad que asigna colores a los valores en función de si la clave
   * hace referencia a una "entrada" o a una "salida".
   */
  const getValueClasses = (key: string) => {
    const lower = key.toLowerCase();
    if (lower.includes('entrada')) return 'text-emerald-400';
    if (lower.includes('salida')) return 'text-rose-400';
    return 'text-gray-300';
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copiado',
        description: 'Datos copiados al portapapeles',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron copiar los datos',
        variant: 'destructive',
      });
    }
  };

  const downloadAsJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitor-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Descarga iniciada',
      description: 'Archivo JSON descargado exitosamente',
    });
  };

  // Función para extraer datos del API de los stepResults
  const extractApiResponses = () => {
    if (!data?.stepResults) return [];
    
    return Object.entries(data.stepResults).filter(([key, value]: [string, any]) => {
      return value?.realApiCall === true || value?.status || value?.data;
    });
  };

  // Función para renderizar respuesta de API con colores
  const renderApiResponse = (stepKey: string, stepData: any) => {
    const statusColor = stepData.success 
      ? (stepData.status >= 200 && stepData.status < 300 ? 'text-green-400' : 'text-yellow-400')
      : 'text-red-400';
    
    return (
      <div key={stepKey} className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-blue-400">
            🌐 API Response - {stepKey.replace('step_', '')}
          </h4>
          <div className="flex gap-2">
            <Badge className={`${statusColor} bg-gray-700`}>
              {stepData.status || 'N/A'}
            </Badge>
            {stepData.realApiCall && (
              <Badge className="bg-green-900 text-green-300">
                Real API Call
              </Badge>
            )}
          </div>
        </div>
        
        {/* Datos de la respuesta */}
        <div className="space-y-3">
          <div>
            <h5 className="mb-2 text-sm font-medium text-cyan-300">📦 Response Data:</h5>
            <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-green-200 overflow-x-auto">
              {JSON.stringify(stepData.data, null, 2)}
            </pre>
          </div>
          
          {stepData.headers && (
            <div>
              <h5 className="mb-2 text-sm font-medium text-cyan-300">📋 Headers:</h5>
              <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-blue-200 overflow-x-auto">
                {JSON.stringify(stepData.headers, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex gap-4 text-xs text-gray-400">
            <span>⏰ {stepData.timestamp}</span>
            {stepData.statusText && <span>📝 {stepData.statusText}</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderDataContent = () => {
    if (!data) {
      return (
        <div className="py-8 text-center text-gray-400">
          No hay datos para mostrar
        </div>
      );
    }

    // Extraer respuestas de API
    const apiResponses = extractApiResponses();

    return (
      <div className="space-y-6">
        {/* Sección 1: Respuestas de APIs */}
        {apiResponses.length > 0 && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-yellow-400">
              🚀 API Responses ({apiResponses.length})
            </h3>
            <div className="space-y-4">
              {apiResponses.map(([stepKey, stepData]) => 
                renderApiResponse(stepKey, stepData)
              )}
            </div>
          </div>
        )}

        {/* Sección 2: Datos del Trigger */}
        {data.trigger && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-green-400">
              ⚡ Trigger Data
            </h3>
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
              <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-green-200 overflow-x-auto">
                {JSON.stringify(data.trigger, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Sección 3: Resultados de todos los pasos */}
        {data.stepResults && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-purple-400">
              🔧 All Step Results
            </h3>
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
              <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-purple-200 overflow-x-auto">
                {JSON.stringify(data.stepResults, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Sección 4: Variables actuales */}
        {data.currentVariables && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-orange-400">
              📊 Current Variables
            </h3>
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
              <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-orange-200 overflow-x-auto">
                {JSON.stringify(data.currentVariables, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Fallback: Mostrar datos completos si no hay estructura conocida */}
        {!data.trigger && !data.stepResults && !data.currentVariables && (
          <div>
            <h3 className="mb-4 text-xl font-bold text-gray-400">
              📄 Raw Data
            </h3>
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
              <pre className="whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-gray-200 overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col gap-4 overflow-hidden bg-gray-900 text-white ring-1 ring-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-500" />
              <DialogTitle>
                Datos del Monitor: <span className="italic">{nodeName}</span>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {outputFormat.toUpperCase()}
              </Badge>
              {timestamp && (
                <Badge variant="secondary" className="text-xs">
                  {new Date(timestamp).toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Barra de acciones */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-2 text-sm text-gray-300">
          <span>
            Mostrando datos capturados por el nodo{' '}
            <span className="font-semibold text-white">{nodeName}</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(JSON.stringify(data, null, 2))
              }
              className="flex items-center gap-2 border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
            >
              <Copy className="h-4 w-4" /> Copiar JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsJson}
              className="flex items-center gap-2 border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
            >
              <Download className="h-4 w-4" /> Descargar
            </Button>
          </div>
        </div>

        {/* Área de datos con scroll */}
        <ScrollArea className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-black p-3">
          {renderDataContent()}
        </ScrollArea>

        {/* Botón de cierre */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2 border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
