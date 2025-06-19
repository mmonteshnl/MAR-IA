import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TriggerNodeConfig, TriggerNodeConfigSchema } from './schema';
import { EXAMPLE_CONFIGS } from './constants';

interface TriggerNodeSettingsProps {
  config: TriggerNodeConfig;
  onChange: (config: TriggerNodeConfig) => void;
}

export function TriggerNodeSettings({ config, onChange }: TriggerNodeSettingsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Manejar cambios en la configuración
  const updateConfig = (updates: Partial<TriggerNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Validar configuración antes de aplicar
    const validation = TriggerNodeConfigSchema.safeParse(newConfig);
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
              ⚡ Disparador Básico
            </Button>
            <Button
              onClick={() => applyExample('named')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🎯 Proceso de Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="info" className="text-xs">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Configuración básica */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs">Nombre del Disparador</Label>
              <Input
                value={config.name || ''}
                onChange={(e) => updateConfig({ name: e.target.value })}
                placeholder="ej. Inicio de Proceso de Lead"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
              <div className="text-xs text-green-400 mt-1">
                Nombre descriptivo para este punto de inicio
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Descripción</Label>
              <Textarea
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                placeholder="ej. Recibe datos del lead y inicia el flujo de automatización"
                rows={3}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
              <div className="text-xs text-green-400 mt-1">
                Descripción opcional del propósito de este disparador
              </div>
            </div>
          </div>

          {/* Preview de la configuración */}
          <Card className="bg-green-950/30 border-green-800/50">
            <CardContent className="p-3">
              <div className="text-sm text-green-300">
                <div className="font-medium mb-2">Vista Previa</div>
                <div className="space-y-1 text-xs">
                  <div>⚡ Nombre: {config.name || 'Sin nombre'}</div>
                  <div>📝 Descripción: {config.description || 'Sin descripción'}</div>
                  <div>🎯 Función: Punto de inicio del flujo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          {/* Información del disparador */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">📊 Datos que Recibe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-400">
              <div className="space-y-1 font-mono">
                <div className="text-gray-300">leadName (texto)</div>
                <div className="text-gray-300">leadEmail (email)</div>
                <div className="text-gray-300">leadIndustry (texto)</div>
                <div className="text-gray-300">leadValue (número)</div>
                <div className="text-gray-300">leadStage (texto)</div>
                <div className="text-gray-300">...otros campos del lead</div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Estos datos están disponibles en otros nodos como <code className="bg-gray-700 px-1 rounded">{"{{trigger.input.leadName}}"}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">🔗 Cómo Usar Variables</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-2">
              <div className="bg-gray-700 p-2 rounded font-mono">
                <div>{"{{trigger.input.leadName}}"}</div>
                <div>{"{{trigger.input.leadEmail}}"}</div>
                <div>{"{{trigger.input.leadValue}}"}</div>
              </div>
              <div>
                Usa estas variables en otros nodos para acceder a los datos del lead
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Información sobre cómo funciona */}
      <Card className="bg-green-950/30 border-green-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-green-400 flex items-center gap-2">
            <Eye className="h-3 w-3" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-green-300">
          <div>• Es el primer nodo de todo flujo de automatización</div>
          <div>• Recibe datos automáticamente cuando ejecutas desde un lead</div>
          <div>• No requiere configuración especial, solo conectar a otros nodos</div>
          <div>• Proporciona variables que puedes usar en nodos posteriores</div>
          <div className="mt-3 pt-2 border-t border-green-800/50">
            <div className="text-green-400 font-medium">💡 Consejo:</div>
            <div>Siempre debe ser el primer nodo. Los otros nodos se conectan a su salida.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}