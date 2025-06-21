import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NodeSettingsProps } from '../types';
import { 
  ApiCallSettings, 
  MonitorSettings, 
  DataTransformSettings 
} from '../settings';
import { Settings as HttpRequestSettings } from '../nodes/HttpRequestNode';
import { LeadValidatorNodeUser as LeadValidatorSettings } from '../nodes/LeadValidatorNode/LeadValidatorNodeSettings';
import { LogicGateNodeSettings } from '../nodes/LogicGate/LogicGateNodeSettings';
import { DataFetcherNodeSettings } from '../nodes/DataFetcher/DataFetcherNodeSettings';
import { WhatsAppNodeSettings } from '../nodes/WhatsAppNode/WhatsAppNodeSettings';
import { ConversationalAICallNodeSettings } from '../nodes/ConversationalAICallNode/ConversationalAICallNodeSettings';

interface NodeSettingsModalProps extends NodeSettingsProps {
  isOpen: boolean;
}

export function NodeSettings({ node, onUpdate, onClose, onDelete, isOpen }: NodeSettingsModalProps) {
  const [config, setConfig] = useState(node.data.config || {});

  const handleSave = () => {
    onUpdate(config);
    toast({
      title: 'Nodo Actualizado',
      description: 'La configuración del nodo ha sido guardada exitosamente',
    });
    onClose();
  };

  const getNodeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      trigger: 'Disparador Manual',
      apiCall: 'API Genérica',
      httpRequest: 'HTTP Request',
      dataTransform: 'Transformar Datos',
      monitor: 'Monitor',
      leadValidator: 'Validador de Leads',
      logicGate: 'Compuerta Lógica',
      dataFetcher: 'Obtener Datos',
      whatsapp: 'WhatsApp',
      conversationalAICall: 'Llamada IA Conversacional'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {node.type === 'leadValidator' ? 'Validador de Leads' : 
             node.type === 'logicGate' ? 'Compuerta Lógica' : 
             node.type === 'dataFetcher' ? 'Obtener Datos' : 
             node.type === 'whatsapp' ? 'WhatsApp' :
             node.type === 'conversationalAICall' ? 'Llamada IA Conversacional' : 'Configuración del Nodo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {node.type !== 'leadValidator' && node.type !== 'logicGate' && node.type !== 'dataFetcher' && node.type !== 'whatsapp' && node.type !== 'conversationalAICall' && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {getNodeTypeLabel(node.type)}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDelete}
                  className="text-red-400 border-red-400 hover:bg-red-900/20 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar Nodo
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre del Nodo</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Ingresa un nombre para el nodo"
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                />
                <p className="text-xs text-gray-400">
                  Usa un nombre descriptivo que identifique claramente la función de este nodo
                </p>
              </div>
            </>
          )}

          {node.type === 'apiCall' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-200">Configuración de API</h3>
              <p className="text-xs text-gray-400 mb-4">
                Configure los detalles de la llamada HTTP que realizará este nodo. Puede usar variables dinámicas con la sintaxis {'{{'}.variable.path{'}}'}
              </p>
              <ApiCallSettings config={config} onChange={setConfig} />
            </div>
          )}

          {node.type === 'httpRequest' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-200">Configuración HTTP Avanzada</h3>
              <p className="text-xs text-gray-400 mb-4">
                Configure peticiones HTTP con opciones avanzadas como timeouts, reintentos y headers personalizados
              </p>
              <HttpRequestSettings config={config} onChange={setConfig} />
            </div>
          )}

          {node.type === 'dataTransform' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-200">Transformación de Datos</h3>
              <p className="text-xs text-gray-400 mb-4">
                Define cómo se transformarán los datos que fluyen a través de este nodo. Puede mapear campos y aplicar lógica personalizada
              </p>
              <DataTransformSettings config={config} onChange={setConfig} />
            </div>
          )}

          {node.type === 'monitor' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-200">Configuración de Monitor</h3>
              <p className="text-xs text-gray-400 mb-4">
                Configure qué datos quiere monitorear y cómo mostrarlos. Útil para debugging y seguimiento del flujo
              </p>
              <MonitorSettings config={config} onChange={setConfig} />
            </div>
          )}

          {node.type === 'trigger' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-200">Disparador Manual</h3>
              <p className="text-xs text-gray-400">
                Este nodo inicia el flujo manualmente. Los datos se proporcionan cuando se ejecuta el flujo desde el panel de pruebas.
              </p>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-600">
                <p className="text-xs text-gray-300">
                  💡 <strong>Consejo:</strong> Use el botón "Probar Flujo" para enviar datos de prueba a través del disparador y ver cómo se comporta su flujo.
                </p>
              </div>
            </div>
          )}

          {node.type === 'leadValidator' && (
            <LeadValidatorSettings config={config} onChange={setConfig} onClose={onClose} />
          )}

          {node.type === 'logicGate' && (
            <LogicGateNodeSettings config={config} onChange={setConfig} onClose={onClose} />
          )}

          {node.type === 'dataFetcher' && (
            <DataFetcherNodeSettings config={config} onChange={setConfig} onClose={onClose} />
          )}

          {node.type === 'whatsapp' && (
            <WhatsAppNodeSettings config={config} onUpdate={setConfig} />
          )}

          {node.type === 'conversationalAICall' && (
            <ConversationalAICallNodeSettings config={config} onChange={setConfig} onClose={onClose} />
          )}
        </div>

        {node.type === 'whatsapp' && (
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Guardar Configuración WhatsApp
            </Button>
          </DialogFooter>
        )}

        {node.type !== 'leadValidator' && node.type !== 'logicGate' && node.type !== 'dataFetcher' && node.type !== 'whatsapp' && node.type !== 'conversationalAICall' && (
          <>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </DialogFooter>
            
            <div className="text-xs text-gray-400 border-t border-gray-600 pt-3 mt-3">
              <p>💡 <strong>Atajo de teclado:</strong> Presione <kbd className="bg-gray-700 px-1 rounded text-gray-200">Supr</kbd> mientras selecciona un nodo para eliminarlo rápidamente</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}