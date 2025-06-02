"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Eye, 
  Code, 
  Wand2, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { PromptTemplate, PromptVariable } from '@/types/ai-prompts';
import { useToast } from '@/hooks/use-toast';

interface PromptPreviewProps {
  template: PromptTemplate;
  globalSettings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

interface TestData {
  [key: string]: string;
}

export default function PromptPreview({ template, globalSettings }: PromptPreviewProps) {
  const { toast } = useToast();
  const [testData, setTestData] = useState<TestData>({});
  const [processedPrompt, setProcessedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize test data with examples
  useEffect(() => {
    const initialData: TestData = {};
    template.variables.forEach(variable => {
      initialData[variable.name] = variable.example || '';
    });
    setTestData(initialData);
  }, [template]);

  // Process prompt with test data
  useEffect(() => {
    try {
      let processed = template.customPrompt || template.defaultPrompt;
      
      // Simple handlebars-like processing
      Object.entries(testData).forEach(([key, value]) => {
        // Replace {{{variable}}} with value
        processed = processed.replace(new RegExp(`{{{${key}}}}`, 'g'), value || '');
        // Replace {{variable}} with value
        processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        
        // Handle conditional blocks {{#if variable}}...{{/if}}
        if (value && value.trim()) {
          processed = processed.replace(
            new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g'),
            '$1'
          );
        } else {
          processed = processed.replace(
            new RegExp(`{{#if ${key}}}[\\s\\S]*?{{/if}}`, 'g'),
            ''
          );
        }
      });
      
      // Clean up any remaining handlebars syntax
      processed = processed.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, '');
      processed = processed.replace(/{{[^}]*}}/g, '[VARIABLE NO DEFINIDA]');
      processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean multiple newlines
      
      setProcessedPrompt(processed);
      setError(null);
    } catch (err) {
      setError('Error procesando el prompt');
      setProcessedPrompt('');
    }
  }, [testData, template]);

  const handleTestDataChange = (variableName: string, value: string) => {
    setTestData(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Check if all required variables have values
      const missingRequired = template.variables
        .filter(v => v.required && (!testData[v.name] || !testData[v.name].trim()))
        .map(v => v.name);
      
      if (missingRequired.length > 0) {
        throw new Error(`Variables requeridas faltantes: ${missingRequired.join(', ')}`);
      }

      // Create input based on template name
      let input: any = {};
      template.variables.forEach(variable => {
        const value = testData[variable.name];
        if (value && value.trim()) {
          if (variable.type === 'array') {
            try {
              input[variable.name] = JSON.parse(value);
            } catch {
              input[variable.name] = []; // Default to empty array if parsing fails
            }
          } else {
            input[variable.name] = value;
          }
        }
      });

      // Map template name to API endpoint
      const endpointMap: Record<string, string> = {
        'Mensaje de Bienvenida': '/api/ai/welcome-message',
        'Evaluación de Negocio': '/api/ai/evaluate-business',
        'Recomendaciones de Ventas': '/api/ai/sales-recommendations',
        'Email de Configuración TPV': '/api/ai/generate-solution-email'
      };

      const endpoint = endpointMap[template.name];
      if (!endpoint) {
        throw new Error('Endpoint no disponible para este template');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const result = await response.json();
      
      // Extract the relevant content based on template type
      let content = '';
      if (result.message) content = result.message;
      else if (result.evaluation) content = result.evaluation;
      else if (result.recommendations) content = JSON.stringify(result.recommendations, null, 2);
      else if (result.asunto && result.cuerpo) content = `ASUNTO: ${result.asunto}\n\nCUERPO:\n${result.cuerpo}`;
      else content = JSON.stringify(result, null, 2);

      setGeneratedResult(content);
      
      toast({
        title: "Éxito",
        description: "Contenido generado correctamente con IA.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(processedPrompt);
    toast({
      title: "Copiado",
      description: "Prompt copiado al portapapeles.",
    });
  };

  const handleCopyResult = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult);
      toast({
        title: "Copiado",
        description: "Resultado copiado al portapapeles.",
      });
    }
  };

  const canGenerate = template.variables
    .filter(v => v.required)
    .every(v => testData[v.name] && testData[v.name].trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Vista Previa - {template.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba tu prompt con datos de ejemplo antes de usarlo en producción
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {globalSettings.model}
              </Badge>
              <Badge variant="outline">
                Temp: {globalSettings.temperature}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Test Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Datos de Prueba
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {variable.name}
                    {variable.required && (
                      <Badge variant="destructive" className="text-xs">
                        Requerida
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {variable.type}
                    </Badge>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {variable.description}
                  </p>
                  {variable.type === 'array' ? (
                    <Textarea
                      value={testData[variable.name] || ''}
                      onChange={(e) => handleTestDataChange(variable.name, e.target.value)}
                      placeholder={variable.example || 'Ingresa datos en formato JSON array'}
                      className="font-mono text-sm"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={testData[variable.name] || ''}
                      onChange={(e) => handleTestDataChange(variable.name, e.target.value)}
                      placeholder={variable.example || `Ingresa ${variable.name}`}
                    />
                  )}
                </div>
              ))}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {template.variables.filter(v => v.required && testData[v.name]?.trim()).length} / {template.variables.filter(v => v.required).length} requeridas completadas
                </div>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={!canGenerate || isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generando...' : 'Generar con IA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">Prompt Procesado</TabsTrigger>
              <TabsTrigger value="result">Resultado IA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prompt" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Prompt Final</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {processedPrompt || 'Complete los datos de prueba para ver el prompt procesado'}
                        </pre>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{processedPrompt.split(/\s+/).length} palabras</span>
                        <span>{processedPrompt.length} caracteres</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Resultado de IA</CardTitle>
                    {generatedResult && (
                      <Button variant="outline" size="sm" onClick={handleCopyResult}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Generando contenido con IA...</p>
                      </div>
                    </div>
                  ) : generatedResult ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Contenido generado exitosamente con el modelo {globalSettings.model}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {generatedResult}
                        </pre>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{generatedResult.split(/\s+/).length} palabras</span>
                        <span>{generatedResult.length} caracteres</span>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Complete los datos requeridos y haga clic en "Generar con IA"
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}