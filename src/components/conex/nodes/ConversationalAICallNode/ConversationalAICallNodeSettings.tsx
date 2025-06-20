// Panel de configuración para el nodo ConversationalAICall
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Phone, Play, AlertCircle, CheckCircle, Info, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ConversationalAICallNodeConfig, CONVERSATIONAL_AI_CALL_DEFAULTS } from './schema';
import { HELP_CONTENT } from './constants';
import { validateConversationalAICallNodeConfig } from './runner';
import { ElevenLabsUtils, getElevenLabsClient } from '@/lib/elevenlabs-api';

interface ConversationalAICallNodeSettingsProps {
  config: ConversationalAICallNodeConfig;
  onChange: (config: ConversationalAICallNodeConfig) => void;
  onClose?: () => void;
}

interface ValidationError {
  path: string;
  message: string;
}

export function ConversationalAICallNodeSettings({ 
  config, 
  onChange, 
  onClose 
}: ConversationalAICallNodeSettingsProps) {
  
  const [currentConfig, setCurrentConfig] = useState<ConversationalAICallNodeConfig>({
    ...CONVERSATIONAL_AI_CALL_DEFAULTS,
    ...config,
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [showInstructionsPreview, setShowInstructionsPreview] = useState(false);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Validar configuración cuando cambie
  useEffect(() => {
    const validation = validateConversationalAICallNodeConfig(currentConfig);
    setValidationErrors(
      validation.errors.map(error => ({ path: 'config', message: error }))
    );
  }, [currentConfig]);

  // Manejar cambios en la configuración
  const handleConfigChange = (field: keyof ConversationalAICallNodeConfig, value: any) => {
    const newConfig = { ...currentConfig, [field]: value };
    setCurrentConfig(newConfig);
  };

  // Aplicar cambios
  const handleSave = () => {
    const validation = validateConversationalAICallNodeConfig(currentConfig);
    if (!validation.isValid) {
      toast({
        title: "Configuración inválida",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    onChange(currentConfig);
    toast({
      title: "Configuración guardada",
      description: "Los cambios han sido aplicados correctamente."
    });
    onClose?.();
  };

  // Cargar configuración de ejemplo
  const loadExampleConfig = (exampleIndex: number) => {
    const examples = HELP_CONTENT.examples;
    if (examples && examples[exampleIndex]) {
      const exampleConfig = examples[exampleIndex].config;
      setCurrentConfig({ ...currentConfig, ...exampleConfig });
      toast({
        title: "Configuración cargada",
        description: `Se ha cargado el ejemplo: ${examples[exampleIndex].title}`
      });
    }
  };

  // Probar configuración de ElevenLabs
  const testConfiguration = async () => {
    setIsTestingConfig(true);
    setTestResult(null);

    try {
      // Validar configuración básica
      const configValidation = ElevenLabsUtils.validateConfig();
      if (!configValidation.isValid) {
        throw new Error(configValidation.errors.join(', '));
      }

      // Validar cliente
      const client = getElevenLabsClient();
      const isValid = await client.validateConfiguration();
      
      if (isValid) {
        setTestResult({
          success: true,
          message: 'Configuración de ElevenLabs válida',
        });
        toast({
          title: "Prueba exitosa",
          description: "La configuración de ElevenLabs es válida."
        });
      } else {
        throw new Error('Configuración de ElevenLabs inválida');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setTestResult({
        success: false,
        message: errorMessage,
      });
      toast({
        title: "Error en la prueba",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingConfig(false);
    }
  };

  // Copiar template de ejemplo
  const copyExampleTemplate = () => {
    const exampleTemplate = CONVERSATIONAL_AI_CALL_DEFAULTS.instructionsTemplate;
    handleConfigChange('instructionsTemplate', exampleTemplate);
    toast({
      title: "Template copiado",
      description: "Se ha cargado el template de ejemplo."
    });
  };

  // Renderizar preview de instrucciones
  const renderInstructionsPreview = () => {
    const sampleData = {
      fullName: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      phone: "+1234567890",
      businessName: "Empresa Ejemplo S.A.",
      source: "Meta Ads",
      organizationName: "Tu Empresa",
    };

    try {
      // Simulación básica de renderizado de Handlebars
      let preview = currentConfig.instructionsTemplate;
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        preview = preview.replace(regex, value.toString());
      });
      
      // Manejar condicionales básicos
      preview = preview.replace(/{{#if\s+\w+}}.*?{{\/if}}/gs, (match) => {
        return match.includes('businessName') || match.includes('source') ? 
          match.replace(/{{#if\s+\w+}}|{{\/if}}/g, '') : '';
      });

      return preview;
    } catch (error) {
      return "Error en el preview del template";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold">Configuración de Llamada IA Conversacional</h2>
        </div>
        {testResult && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {testResult.success ? 'Configuración válida' : 'Error en configuración'}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="instructions">Instrucciones</TabsTrigger>  
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          <TabsTrigger value="examples">Ejemplos</TabsTrigger>
        </TabsList>

        {/* Tab: Configuración Básica */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Principal</CardTitle>
              <CardDescription>
                Configuración básica para el nodo de llamadas con IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre del nodo */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del nodo</Label>
                <Input
                  id="name"
                  value={currentConfig.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  placeholder="Llamada IA Conversacional"
                />
              </div>

              {/* Agent ID */}
              <div className="space-y-2">
                <Label htmlFor="agentId">Agent ID de ElevenLabs *</Label>
                <Input
                  id="agentId"
                  value={currentConfig.agentId}
                  onChange={(e) => handleConfigChange('agentId', e.target.value)}
                  placeholder="agent_abc123..."
                />
                <p className="text-sm text-gray-500">
                  ID del agente conversacional de ElevenLabs
                </p>
              </div>

              {/* Voice ID */}
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice ID (Opcional)</Label>
                <Input
                  id="voiceId"
                  value={currentConfig.voiceId || ''}
                  onChange={(e) => handleConfigChange('voiceId', e.target.value || undefined)}
                  placeholder="voice_xyz789..."
                />
                <p className="text-sm text-gray-500">
                  Si no se especifica, usa la voz por defecto del agente
                </p>
              </div>

              {/* Campo de teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phoneField">Campo de teléfono</Label>
                <Select
                  value={currentConfig.phoneField}
                  onValueChange={(value) => handleConfigChange('phoneField', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">phone</SelectItem>
                    <SelectItem value="phoneNumber">phoneNumber</SelectItem>
                    <SelectItem value="mobile">mobile</SelectItem>
                    <SelectItem value="telephone">telephone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Campo que contiene el número de teléfono en los datos del lead
                </p>
              </div>

              {/* Duración máxima */}
              <div className="space-y-4">
                <Label>Duración máxima de llamada: {Math.floor(currentConfig.maxDuration / 60)}m {currentConfig.maxDuration % 60}s</Label>
                <Slider
                  value={[currentConfig.maxDuration]}
                  onValueChange={([value]) => handleConfigChange('maxDuration', value)}
                  min={30}
                  max={1800}
                  step={30}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>30s</span>
                  <span>30m</span>
                </div>
              </div>

              {/* Test de configuración */}
              <div className="pt-4 border-t">
                <Button
                  onClick={testConfiguration}
                  disabled={isTestingConfig}
                  variant="outline"
                  className="w-full"
                >
                  {isTestingConfig ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Probando configuración...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Probar configuración
                    </>
                  )}
                </Button>
                {testResult && (
                  <div className={`mt-2 p-3 rounded ${
                    testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Instrucciones */}
        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Template de Instrucciones
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyExampleTemplate}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Ejemplo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInstructionsPreview(!showInstructionsPreview)}
                  >
                    {showInstructionsPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Define las instrucciones que el agente de IA seguirá durante la llamada.
                Puedes usar variables como fullName, email, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={currentConfig.instructionsTemplate}
                  onChange={(e) => handleConfigChange('instructionsTemplate', e.target.value)}
                  placeholder="Escribe las instrucciones para el agente..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-gray-500">
                  Variables disponibles: fullName, email, phone, businessName, source, organizationName
                </p>
              </div>

              {/* Preview de instrucciones */}
              {showInstructionsPreview && (
                <div className="mt-4">
                  <Label>Preview con datos de ejemplo:</Label>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <pre className="text-sm whitespace-pre-wrap">
                      {renderInstructionsPreview()}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración Avanzada */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Opciones adicionales para el comportamiento del nodo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reintentos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reintentar en caso de fallo</Label>
                    <p className="text-sm text-gray-500">
                      Reintenta automáticamente si la llamada falla
                    </p>
                  </div>
                  <Switch
                    checked={currentConfig.retryOnFailure}
                    onCheckedChange={(checked) => handleConfigChange('retryOnFailure', checked)}
                  />
                </div>

                {currentConfig.retryOnFailure && (
                  <div className="space-y-2">
                    <Label>Máximo de reintentos: {currentConfig.maxRetries}</Label>
                    <Slider
                      value={[currentConfig.maxRetries]}
                      onValueChange={([value]) => handleConfigChange('maxRetries', value)}
                      min={0}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0</span>
                      <span>3</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actualización de stage */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Actualizar stage del lead</Label>
                    <p className="text-sm text-gray-500">
                      Cambia automáticamente el estado del lead según el resultado
                    </p>
                  </div>
                  <Switch
                    checked={currentConfig.updateLeadStage}
                    onCheckedChange={(checked) => handleConfigChange('updateLeadStage', checked)}
                  />
                </div>

                {currentConfig.updateLeadStage && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="successStage">Stage si exitoso</Label>
                      <Input
                        id="successStage"
                        value={currentConfig.newStageOnSuccess || ''}
                        onChange={(e) => handleConfigChange('newStageOnSuccess', e.target.value || undefined)}
                        placeholder="contacted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="failureStage">Stage si falla</Label>
                      <Input
                        id="failureStage"
                        value={currentConfig.newStageOnFailure || ''}
                        onChange={(e) => handleConfigChange('newStageOnFailure', e.target.value || undefined)}
                        placeholder="call_failed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ejemplos */}
        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-4">
            {HELP_CONTENT.examples?.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => loadExampleConfig(index)}
                    className="w-full"
                  >
                    Cargar esta configuración
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer con acciones */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.length} error(es) de validación
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={validationErrors.length > 0}
          >
            Guardar configuración
          </Button>
        </div>
      </div>
    </div>
  );
}