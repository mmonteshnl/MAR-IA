import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Copy, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DataTransformNodeConfig, DataTransformNodeConfigSchema } from './schema';
import { TRANSFORM_TYPES, COMMON_TRANSFORMATIONS } from './constants';

interface DataTransformNodeSettingsProps {
  config: DataTransformNodeConfig;
  onChange: (config: DataTransformNodeConfig) => void;
}

export function DataTransformNodeSettings({ config, onChange }: DataTransformNodeSettingsProps) {
  const [expandedTransformation, setExpandedTransformation] = useState<string | null>(null);

  const updateConfig = (updates: Partial<DataTransformNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    const validation = DataTransformNodeConfigSchema.safeParse(newConfig);
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

  const addTransformation = () => {
    const newTransformation = {
      id: `transform_${Date.now()}`,
      sourceField: 'response.data',
      targetField: 'newField',
      transform: 'copy' as const,
    };
    
    const transformations = [...config.transformations, newTransformation];
    updateConfig({ transformations });
    setExpandedTransformation(newTransformation.id);
  };

  const updateTransformation = (id: string, updates: any) => {
    const transformations = config.transformations.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    updateConfig({ transformations });
  };

  const removeTransformation = (id: string) => {
    const transformations = config.transformations.filter(t => t.id !== id);
    updateConfig({ transformations });
    if (expandedTransformation === id) {
      setExpandedTransformation(null);
    }
  };

  const addCommonTransformation = (template: typeof COMMON_TRANSFORMATIONS[0]) => {
    const newTransformation = {
      id: `transform_${Date.now()}`,
      ...template,
    };
    
    const transformations = [...config.transformations, newTransformation];
    updateConfig({ transformations });
    
    toast({
      title: 'Transformación Agregada',
      description: `"${template.name}" ha sido agregada`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Configuración básica */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">Configuración Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Nombre del Nodo</Label>
            <Input
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="Transformar"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
          
          <div>
            <Label className="text-gray-300 text-xs">Nombre del Objeto de Salida</Label>
            <Input
              value={config.outputName}
              onChange={(e) => updateConfig({ outputName: e.target.value })}
              placeholder="transformedData"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300 text-sm">Preservar Datos Originales</Label>
              <div className="text-xs text-gray-400">Incluir datos originales en la salida</div>
            </div>
            <Switch
              checked={config.preserveOriginal}
              onCheckedChange={(preserveOriginal) => updateConfig({ preserveOriginal })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transformaciones comunes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">⚡ Transformaciones Comunes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {COMMON_TRANSFORMATIONS.map((template, index) => (
              <Button
                key={index}
                onClick={() => addCommonTransformation(template)}
                size="sm"
                variant="outline"
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
              >
                <Zap className="h-3 w-3 mr-2" />
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de transformaciones */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm text-gray-200">
              Transformaciones ({config.transformations.length})
            </CardTitle>
            <Button
              onClick={addTransformation}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.transformations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No hay transformaciones configuradas</div>
              <div className="text-xs">Agrega una transformación para comenzar</div>
            </div>
          ) : (
            config.transformations.map((transformation) => (
              <Card key={transformation.id} className="bg-gray-900 border-gray-600">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {TRANSFORM_TYPES[transformation.transform].icon}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-200">
                          {transformation.targetField}
                        </div>
                        <div className="text-xs text-gray-400">
                          {TRANSFORM_TYPES[transformation.transform].label}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setExpandedTransformation(
                          expandedTransformation === transformation.id ? null : transformation.id
                        )}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-200"
                      >
                        {expandedTransformation === transformation.id ? '▼' : '▶'}
                      </Button>
                      <Button
                        onClick={() => removeTransformation(transformation.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedTransformation === transformation.id && (
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300 text-xs">Campo Origen</Label>
                        <Input
                          value={transformation.sourceField}
                          onChange={(e) => updateTransformation(transformation.id, { sourceField: e.target.value })}
                          placeholder="response.data.name"
                          className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">Campo Destino</Label>
                        <Input
                          value={transformation.targetField}
                          onChange={(e) => updateTransformation(transformation.id, { targetField: e.target.value })}
                          placeholder="nombreCompleto"
                          className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 text-xs">Tipo de Transformación</Label>
                      <Select
                        value={transformation.transform}
                        onValueChange={(transform: any) => updateTransformation(transformation.id, { transform })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {Object.entries(TRANSFORM_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <div>
                                  <div>{type.label}</div>
                                  <div className="text-xs text-gray-400">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Configuración específica por tipo */}
                    {transformation.transform === 'format' && (
                      <div>
                        <Label className="text-gray-300 text-xs">Template de Formato</Label>
                        <Input
                          value={transformation.formatTemplate || ''}
                          onChange={(e) => updateTransformation(transformation.id, { formatTemplate: e.target.value })}
                          placeholder="{{response.firstName}} {{response.lastName}}"
                          className="bg-gray-700 border-gray-600 text-gray-100 text-xs font-mono"
                        />
                      </div>
                    )}

                    {transformation.transform === 'map' && (
                      <div>
                        <Label className="text-gray-300 text-xs">Mapeo de Valores (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(transformation.mapping || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const mapping = JSON.parse(e.target.value);
                              updateTransformation(transformation.id, { mapping });
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder='{"active": "Activo", "inactive": "Inactivo"}'
                          className="bg-gray-700 border-gray-600 text-gray-100 text-xs font-mono"
                          rows={4}
                        />
                      </div>
                    )}

                    {transformation.transform === 'extract' && (
                      <div>
                        <Label className="text-gray-300 text-xs">Ruta de Extracción</Label>
                        <Input
                          value={transformation.extractPath || ''}
                          onChange={(e) => updateTransformation(transformation.id, { extractPath: e.target.value })}
                          placeholder="user.profile.name"
                          className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
                        />
                      </div>
                    )}

                    {transformation.transform === 'combine' && (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-gray-300 text-xs">Campos a Combinar</Label>
                          <Input
                            value={transformation.combineFields?.join(', ') || ''}
                            onChange={(e) => updateTransformation(transformation.id, { 
                              combineFields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                            })}
                            placeholder="response.firstName, response.lastName"
                            className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-xs">Template de Combinación</Label>
                          <Input
                            value={transformation.combineTemplate || ''}
                            onChange={(e) => updateTransformation(transformation.id, { combineTemplate: e.target.value })}
                            placeholder="{{combine.response.firstName}} {{combine.response.lastName}}"
                            className="bg-gray-700 border-gray-600 text-gray-100 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Vista previa */}
      {config.transformations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-300">📋 Resumen</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-400 space-y-1">
            <div>• Transformaciones: {config.transformations.length}</div>
            <div>• Salida: {config.outputName}</div>
            <div>• Preservar originales: {config.preserveOriginal ? 'Sí' : 'No'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}