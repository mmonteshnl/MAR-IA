import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Monitor, Copy, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MonitorNodeConfig, MonitorNodeConfigSchema } from './schema';
import { EXAMPLE_CONFIGS, OUTPUT_FORMATS } from './constants';

interface MonitorNodeSettingsProps {
  config: MonitorNodeConfig;
  onChange: (config: MonitorNodeConfig) => void;
}

export function MonitorNodeSettings({ config, onChange }: MonitorNodeSettingsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Manejar cambios en la configuración
  const updateConfig = (updates: Partial<MonitorNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Validar configuración antes de aplicar
    const validation = MonitorNodeConfigSchema.safeParse(newConfig);
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
              📋 Debug Básico
            </Button>
            <Button
              onClick={() => applyExample('filtered')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔍 Debug Filtrado
            </Button>
            <Button
              onClick={() => applyExample('detailed')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📊 Debug Detallado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Configuración básica */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs">Nombre del Monitor</Label>
              <Input
                value={config.name || ''}
                onChange={(e) => updateConfig({ name: e.target.value })}
                placeholder="ej. Debug Lead Data"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
              <div className="text-xs text-cyan-400 mt-1">
                Nombre descriptivo para este monitor
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Campos a Mostrar</Label>
              <Textarea
                value={config.displayFields || ''}
                onChange={(e) => updateConfig({ displayFields: e.target.value })}
                placeholder="leadName,leadEmail,leadIndustry,leadValue"
                rows={3}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono text-sm"
              />
              <div className="text-xs text-cyan-400 mt-1">
                Lista de campos separados por comas. Deja vacío para mostrar todo.
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Formato de Salida</Label>
              <Select 
                value={config.outputFormat || 'json'} 
                onValueChange={(value: any) => updateConfig({ outputFormat: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
                    <SelectItem key={key} value={key} className="text-gray-100 focus:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{format.icon}</span>
                        <span>{format.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-cyan-400 mt-1">
                {OUTPUT_FORMATS[config.outputFormat || 'json']?.description}
              </div>
            </div>
          </div>

          {/* Preview de la configuración */}
          <Card className="bg-cyan-950/30 border-cyan-800/50">
            <CardContent className="p-3">
              <div className="text-sm text-cyan-300">
                <div className="font-medium mb-2">Vista Previa</div>
                <div className="space-y-1 text-xs">
                  <div>📋 Monitor: {config.name || 'Sin nombre'}</div>
                  <div>🔍 Formato: {OUTPUT_FORMATS[config.outputFormat || 'json']?.label}</div>
                  <div>📊 Campos: {config.displayFields ? config.displayFields.split(',').length + ' filtrados' : 'Todos'}</div>
                  <div>⏰ Timestamp: {config.enableTimestamp ? 'Activado' : 'Desactivado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Configuración avanzada */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 text-sm">Incluir Timestamp</Label>
                <div className="text-xs text-gray-400">Agregar marca de tiempo a cada captura</div>
              </div>
              <Switch
                checked={config.enableTimestamp ?? true}
                onCheckedChange={(enableTimestamp) => updateConfig({ enableTimestamp })}
              />
            </div>

            {/* Información de campos disponibles */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-300">💡 Ejemplos de Campos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-gray-300">leadName,leadEmail</div>
                  <div className="text-gray-300">step_api-call-1.response</div>
                  <div className="text-gray-300">step_transform-1.output</div>
                  <div className="text-gray-300">trigger.input</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Puedes usar paths anidados con notación de puntos
                </div>
              </CardContent>
            </Card>

            {/* Información de configuración */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-300">📊 Resumen de Configuración</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 space-y-1">
                <div>• Nombre: {config.name || 'No configurado'}</div>
                <div>• Formato: {OUTPUT_FORMATS[config.outputFormat || 'json']?.label}</div>
                <div>• Campos: {config.displayFields ? 'Filtrados' : 'Todos los disponibles'}</div>
                <div>• Timestamp: {config.enableTimestamp ? 'Incluido' : 'No incluido'}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Información sobre cómo funciona */}
      <Card className="bg-cyan-950/30 border-cyan-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-cyan-400 flex items-center gap-2">
            <Eye className="h-3 w-3" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-cyan-300">
          <div>• Los datos del flujo se capturan aquí</div>
          <div>• Se muestran en la consola del navegador (F12)</div>
          <div>• Útil para debugging y verificar transformaciones</div>
          <div>• No afecta el flujo, solo observa</div>
          <div className="mt-3 pt-2 border-t border-cyan-800/50">
            <div className="text-cyan-400 font-medium">💡 Consejo:</div>
            <div>Abre la consola del navegador para ver los datos capturados en tiempo real</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}