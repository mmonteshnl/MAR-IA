import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BaseNodeConfig, BaseNodeConfigSchema } from './schema';
import { EXAMPLE_CONFIGS } from './constants';

interface BaseNodeSettingsProps {
  config: BaseNodeConfig;
  onChange: (config: BaseNodeConfig) => void;
}

export function BaseNodeSettings({ config, onChange }: BaseNodeSettingsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Manejar cambios en la configuración
  const updateConfig = (updates: Partial<BaseNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Validar configuración antes de aplicar
    const validation = BaseNodeConfigSchema.safeParse(newConfig);
    if (validation.success) {
      onChange(validation.data);
    } else {
      toast({
        title: 'Error de Configuración',
        description: validation.error.errors[0]?.message || 'Configuración inválida',
        variant: 'destructive',
      });
    }
  };

  // Aplicar configuración de ejemplo
  const applyExample = (exampleKey: keyof typeof EXAMPLE_CONFIGS) => {
    const example = EXAMPLE_CONFIGS[exampleKey];
    updateConfig(example);
    toast({
      title: 'Ejemplo Aplicado',
      description: `Configuración "${example.name}" cargada exitosamente`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Ejemplos rápidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">⚡ Configuraciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => applyExample('basic')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📋 Básica
            </Button>
            <Button
              onClick={() => applyExample('advanced')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🚀 Avanzada
            </Button>
            {/* TODO: Agregar más botones de ejemplo específicos */}
          </div>
        </CardContent>
      </Card>

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          {/* TODO: Ajustar número de tabs según necesidades */}
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Configuración básica */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs">Nombre del Nodo</Label>
              <Input
                value={config.name || ''}
                onChange={(e) => updateConfig({ name: e.target.value })}
                placeholder="Nombre descriptivo del nodo"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
              <div className="text-xs text-gray-400 mt-1">
                Nombre que aparecerá en el flujo y en los logs
              </div>
            </div>

            {/* TODO: Agregar campos específicos del nodo aquí */}
            {/* Ejemplo:
            <div>
              <Label className="text-gray-300 text-xs">URL del Endpoint</Label>
              <Input
                value={config.url || ''}
                onChange={(e) => updateConfig({ url: e.target.value })}
                placeholder="https://api.ejemplo.com/endpoint"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
              <div className="text-xs text-gray-400 mt-1">
                URL completa del endpoint a consumir
              </div>
            </div>
            */}
          </div>

          {/* Preview de la configuración */}
          <Card className="bg-gray-900 border-gray-600">
            <CardContent className="p-3">
              <div className="text-sm text-gray-300">
                <div className="font-medium">Vista Previa</div>
                <div className="text-xs text-gray-400 mt-1">
                  Nodo: {config.name || 'Sin nombre'}
                  {/* TODO: Agregar información específica del preview aquí */}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Configuración avanzada */}
          <div className="space-y-4">
            {/* TODO: Agregar configuraciones avanzadas específicas del nodo aquí */}
            
            <div className="text-sm text-gray-400">
              💡 <strong>Configuraciones avanzadas disponibles próximamente</strong>
            </div>

            {/* Ejemplo de configuración avanzada:
            <div>
              <Label className="text-gray-300 text-xs">Timeout (segundos)</Label>
              <Input
                type="number"
                min="1"
                max="300"
                value={config.timeout || 30}
                onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 30 })}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
              <div className="text-xs text-gray-400 mt-1">Tiempo máximo de espera</div>
            </div>
            */}
          </div>

          {/* Información de configuración */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">📊 Resumen de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <div>• Nombre: {config.name || 'No configurado'}</div>
              {/* TODO: Agregar resumen específico del nodo aquí */}
              <div>• Estado: Configurado</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ayuda y documentación */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-gray-300">📚 Ayuda y Documentación</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 space-y-2">
          <div>
            Este nodo permite [DESCRIPCIÓN ESPECÍFICA DEL NODO].
            {/* TODO: Agregar descripción real del nodo */}
          </div>
          <div>
            <strong>Variables disponibles:</strong> Puedes usar variables dinámicas con la sintaxis <code>{`{{variable.path}}`}</code>
          </div>
          <div>
            <strong>Ejemplos:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><code>{`{{trigger.input.campo}}`}</code> - Datos del disparador</li>
              <li><code>{`{{step_nodeId.response}}`}</code> - Resultado de nodos anteriores</li>
              <li><code>{`{{connections.api.token}}`}</code> - Credenciales de conexiones</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}