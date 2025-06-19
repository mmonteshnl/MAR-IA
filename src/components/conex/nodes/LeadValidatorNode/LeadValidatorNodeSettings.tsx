import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, AlertTriangle, Info, UserCheck, Copy, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LeadValidatorNodeConfig, LeadValidatorNodeConfigSchema, COMPARISON_OPERATORS, LOGIC_OPERATORS } from './schema';
import { LEAD_VALIDATOR_DEFAULTS, EXAMPLE_CONFIGS, HELP_CONTENT } from './constants';
import { validateLeadValidatorNodeConfig } from './runner';

interface LeadValidatorNodeUserProps {
  config: LeadValidatorNodeConfig;
  onChange: (config: LeadValidatorNodeConfig) => void;
  onClose?: () => void;
}

interface ValidationError {
  path: string;
  message: string;
}

export function LeadValidatorNodeUser({ config, onChange, onClose }: LeadValidatorNodeUserProps) {
  const [currentConfig, setCurrentConfig] = useState<LeadValidatorNodeConfig>({
    ...LEAD_VALIDATOR_DEFAULTS,
    ...config,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewConfig, setPreviewConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Función para actualizar configuración y validar
  const updateConfig = (newConfig: LeadValidatorNodeConfig) => {
    setCurrentConfig(newConfig);
    
    // Validar configuración
    const validation = validateLeadValidatorNodeConfig(newConfig);
    if (!validation.valid) {
      setValidationErrors(validation.errors || []);
    } else {
      setValidationErrors([]);
    }
  };

  // Función para manejar cambios en fields básicos
  const handleBasicChange = (field: string, value: any) => {
    const newConfig = { ...currentConfig, [field]: value };
    updateConfig(newConfig);
  };

  // Función para agregar condición
  const addCondition = () => {
    const newCondition = {
      field: '',
      operator: '==' as const,
      value: '',
      logicOperator: 'AND' as const,
    };

    const newConfig = { ...currentConfig };
    if (currentConfig.mode === 'validator') {
      newConfig.validatorConfig = {
        ...currentConfig.validatorConfig,
        conditions: [...(currentConfig.validatorConfig?.conditions || []), newCondition],
      };
    }
    
    updateConfig(newConfig);
  };

  // Función para eliminar condición
  const removeCondition = (index: number) => {
    const newConfig = { ...currentConfig };
    
    if (currentConfig.mode === 'validator') {
      newConfig.validatorConfig = {
        ...currentConfig.validatorConfig,
        conditions: currentConfig.validatorConfig?.conditions?.filter((_, i) => i !== index) || [],
      };
    }
    
    updateConfig(newConfig);
  };

  // Función para actualizar condición específica
  const updateCondition = (index: number, field: string, value: any) => {
    const newConfig = { ...currentConfig };
    
    if (currentConfig.mode === 'validator' && newConfig.validatorConfig?.conditions) {
      newConfig.validatorConfig.conditions[index] = {
        ...newConfig.validatorConfig.conditions[index],
        [field]: value,
      };
    }
    
    updateConfig(newConfig);
  };

  // Aplicar configuración de ejemplo
  const applyExample = (exampleKey: keyof typeof EXAMPLE_CONFIGS) => {
    const example = EXAMPLE_CONFIGS[exampleKey];
    updateConfig({ ...currentConfig, ...example });
    toast({
      title: 'Ejemplo Aplicado',
      description: `Configuración "${example.name}" cargada exitosamente`,
    });
  };

  // Función para guardar cambios
  const handleSave = () => {
    if (validationErrors.length === 0) {
      onChange(currentConfig);
      onClose?.();
      toast({
        title: 'Configuración Guardada',
        description: 'Los cambios se han aplicado correctamente',
      });
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-900/50 rounded-lg border border-orange-700">
            <UserCheck className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Validador de Leads</h2>
            <p className="text-sm text-gray-400">Configura condiciones de validación, edición y enrutado</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewConfig(!previewConfig)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {previewConfig ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewConfig ? 'Ocultar' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <Card className="border-red-700 bg-red-900/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <CardTitle className="text-sm text-red-300">Errores de Configuración</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-400">
                  <span className="font-medium">{error.path}:</span> {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ejemplos rápidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">⚡ Configuraciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => applyExample('validatorPremium')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔍 Validador Premium
            </Button>
            <Button
              onClick={() => applyExample('editorPriority')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              ✏️ Editor de Prioridad
            </Button>
            <Button
              onClick={() => applyExample('routerValue')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🚦 Router por Valor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa de configuración */}
      {previewConfig && (
        <Card className="bg-gray-900 border-gray-600">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Vista Previa JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-800 p-3 rounded border border-gray-700 overflow-auto max-h-64 text-gray-300">
              {JSON.stringify(currentConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="conditions" className="text-xs">Condiciones</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Configuración básica */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Configuración Básica</CardTitle>
              <CardDescription className="text-gray-400">Nombre y modo de operación del nodo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 text-xs">Nombre del Nodo</Label>
                  <Input
                    id="name"
                    value={currentConfig.name || ''}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    placeholder="Ej: Validador Premium"
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-gray-300 text-xs">Modo de Operación</Label>
                  <Select
                    value={currentConfig.mode}
                    onValueChange={(value) => handleBasicChange('mode', value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="validator" className="text-gray-100">🔍 Validator - Validar condiciones</SelectItem>
                      <SelectItem value="editor" className="text-gray-100">✏️ Editor - Modificar datos</SelectItem>
                      <SelectItem value="router" className="text-gray-100">🚦 Router - Dirigir flujo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableLogging"
                    checked={currentConfig.enableLogging}
                    onCheckedChange={(checked) => handleBasicChange('enableLogging', checked)}
                  />
                  <Label htmlFor="enableLogging" className="text-sm text-gray-300">Habilitar logs</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="continueOnError"
                    checked={currentConfig.continueOnError}
                    onCheckedChange={(checked) => handleBasicChange('continueOnError', checked)}
                  />
                  <Label htmlFor="continueOnError" className="text-sm text-gray-300">Continuar al fallar</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview de la configuración */}
          <Card className="bg-gray-900 border-gray-600">
            <CardContent className="p-3">
              <div className="text-sm text-gray-300">
                <div className="font-medium">Vista Previa</div>
                <div className="text-xs text-gray-400 mt-1">
                  Nodo: {currentConfig.name || 'Sin nombre'} | Modo: {currentConfig.mode}
                  {currentConfig.mode === 'validator' && (
                    <div>Condiciones: {currentConfig.validatorConfig?.conditions?.length || 0}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          {/* Configuración específica por modo */}
          {currentConfig.mode === 'validator' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Condiciones de Validación</CardTitle>
                <CardDescription className="text-gray-400">Define condiciones para validar datos de leads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-200">Condiciones</h4>
                  <Button variant="outline" size="sm" onClick={addCondition} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Condición
                  </Button>
                </div>

                {/* Lista de condiciones */}
                <div className="space-y-3">
                  {(currentConfig.validatorConfig?.conditions || []).map((condition, index) => (
                    <Card key={index} className="p-4 bg-gray-900 border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-300">Campo</Label>
                          <Input
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            placeholder="Ej: context"
                            className="text-sm bg-gray-700 border-gray-600 text-gray-100"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-300">Operador</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, 'operator', value)}
                          >
                            <SelectTrigger className="text-sm bg-gray-700 border-gray-600 text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {COMPARISON_OPERATORS.map((op) => (
                                <SelectItem key={op} value={op} className="text-sm text-gray-100">
                                  {op}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-300">Valor</Label>
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Ej: premium"
                            className="text-sm bg-gray-700 border-gray-600 text-gray-100"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-300">Lógica</Label>
                          <Select
                            value={condition.logicOperator || 'AND'}
                            onValueChange={(value) => updateCondition(index, 'logicOperator', value)}
                          >
                            <SelectTrigger className="text-sm bg-gray-700 border-gray-600 text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {LOGIC_OPERATORS.map((op) => (
                                <SelectItem key={op} value={op} className="text-sm text-gray-100">
                                  {op}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="text-red-400 hover:text-red-300 border-gray-600 hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Configuración de resultado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outputField" className="text-gray-300 text-xs">Campo de Salida</Label>
                    <Input
                      id="outputField"
                      value={currentConfig.validatorConfig?.outputField || ''}
                      onChange={(e) => {
                        const newConfig = { ...currentConfig };
                        newConfig.validatorConfig = {
                          ...newConfig.validatorConfig,
                          outputField: e.target.value,
                        };
                        updateConfig(newConfig);
                      }}
                      placeholder="Ej: isValid"
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trueMessage" className="text-gray-300 text-xs">Mensaje Éxito</Label>
                    <Input
                      id="trueMessage"
                      value={currentConfig.validatorConfig?.trueMessage || ''}
                      onChange={(e) => {
                        const newConfig = { ...currentConfig };
                        newConfig.validatorConfig = {
                          ...newConfig.validatorConfig,
                          trueMessage: e.target.value,
                        };
                        updateConfig(newConfig);
                      }}
                      placeholder="Validación exitosa"
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="falseMessage" className="text-gray-300 text-xs">Mensaje Fallo</Label>
                    <Input
                      id="falseMessage"
                      value={currentConfig.validatorConfig?.falseMessage || ''}
                      onChange={(e) => {
                        const newConfig = { ...currentConfig };
                        newConfig.validatorConfig = {
                          ...newConfig.validatorConfig,
                          falseMessage: e.target.value,
                        };
                        updateConfig(newConfig);
                      }}
                      placeholder="Validación fallida"
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentConfig.mode === 'editor' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Configuración Editor</CardTitle>
                <CardDescription className="text-gray-400">Configura acciones para modificar datos de leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-blue-900/30 border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Modo Editor</span>
                  </div>
                  <p className="text-sm text-blue-400">
                    El modo Editor permite modificar los datos del lead basado en condiciones.
                    La configuración completa está disponible en formato JSON avanzado.
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="editorJsonConfig" className="text-gray-300 text-xs">Configuración JSON del Editor</Label>
                  <Textarea
                    id="editorJsonConfig"
                    value={JSON.stringify(currentConfig.editorConfig || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleBasicChange('editorConfig', parsed);
                      } catch {
                        // Ignorar errores de JSON inválido temporalmente
                      }
                    }}
                    className="font-mono text-sm bg-gray-700 border-gray-600 text-gray-100"
                    rows={8}
                    placeholder="Configuración JSON para modo editor..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentConfig.mode === 'router' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Configuración Router</CardTitle>
                <CardDescription className="text-gray-400">Establece rutas basadas en condiciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-purple-900/30 border-purple-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">Modo Router</span>
                  </div>
                  <p className="text-sm text-purple-400">
                    El modo Router dirige el flujo a diferentes rutas basado en condiciones.
                    La configuración completa está disponible en formato JSON avanzado.
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="routerJsonConfig" className="text-gray-300 text-xs">Configuración JSON del Router</Label>
                  <Textarea
                    id="routerJsonConfig"
                    value={JSON.stringify(currentConfig.routerConfig || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleBasicChange('routerConfig', parsed);
                      } catch {
                        // Ignorar errores de JSON inválido temporalmente
                      }
                    }}
                    className="font-mono text-sm bg-gray-700 border-gray-600 text-gray-100"
                    rows={8}
                    placeholder="Configuración JSON para modo router..."
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Configuración avanzada */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-200">Configuración Avanzada</CardTitle>
                  <CardDescription className="text-gray-400">Opciones de logging y comportamiento</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logLevel" className="text-gray-300 text-xs">Nivel de Log</Label>
                    <Select
                      value={currentConfig.logLevel}
                      onValueChange={(value) => handleBasicChange('logLevel', value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none" className="text-gray-100">Sin logs</SelectItem>
                        <SelectItem value="basic" className="text-gray-100">Básico</SelectItem>
                        <SelectItem value="detailed" className="text-gray-100">Detallado</SelectItem>
                        <SelectItem value="verbose" className="text-gray-100">Verboso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout" className="text-gray-300 text-xs">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={currentConfig.timeout || 30000}
                      onChange={(e) => handleBasicChange('timeout', parseInt(e.target.value))}
                      min={1000}
                      max={300000}
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Información de configuración */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">📊 Resumen de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <div>• Nombre: {currentConfig.name || 'No configurado'}</div>
              <div>• Modo: {currentConfig.mode}</div>
              <div>• Logging: {currentConfig.enableLogging ? 'Habilitado' : 'Deshabilitado'}</div>
              <div>• Continuar en error: {currentConfig.continueOnError ? 'Sí' : 'No'}</div>
              {currentConfig.mode === 'validator' && (
                <div>• Condiciones: {currentConfig.validatorConfig?.conditions?.length || 0}</div>
              )}
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
            Este nodo permite validar, editar y enrutar datos de leads basado en condiciones lógicas avanzadas.
          </div>
          <div>
            <strong>Variables disponibles:</strong> Puedes usar variables dinámicas con la sintaxis <code>{`{{variable.path}}`}</code>
          </div>
          <div>
            <strong>Campos comunes de leads:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><code>context</code> - Contexto del lead (premium, standard)</li>
              <li><code>leadValue</code> - Valor monetario del lead</li>
              <li><code>leadEmail</code> - Email del lead</li>
              <li><code>leadIndustry</code> - Industria del lead</li>
              <li><code>leadSource</code> - Fuente del lead</li>
            </ul>
          </div>
          <div>
            <strong>Ejemplos de condiciones:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><code>context == "premium"</code> - Lead premium</li>
              <li><code>leadValue > 5000</code> - Valor mayor a 5000</li>
              <li><code>leadEmail contains "@empresa.com"</code> - Email corporativo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={validationErrors.length > 0}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}