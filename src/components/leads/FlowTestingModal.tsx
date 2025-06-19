"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Play, 
  Copy, 
  Terminal, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  FileText,
  Zap,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useManualFlows } from '@/hooks/useManualFlows';
import { toast } from '@/hooks/use-toast';
import type { ExtendedLead as Lead } from '@/types';

interface FlowTestingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export default function FlowTestingModal({
  open,
  onOpenChange,
  lead
}: FlowTestingModalProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { manualFlows, isLoading: flowsLoading } = useManualFlows();
  
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [customPayload, setCustomPayload] = useState<string>('');
  const [method, setMethod] = useState<'GET' | 'POST'>('POST');
  const [endpoint, setEndpoint] = useState<'id' | 'alias'>('alias');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [generatedCurl, setGeneratedCurl] = useState<string>('');
  const [generatedFetch, setGeneratedFetch] = useState<string>('');

  // Generar payload por defecto basado en el lead
  useEffect(() => {
    if (lead && !customPayload) {
      const defaultPayload = {
        leadData: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          stage: lead.stage,
          source: lead.source
          // description: lead.description, // Removed because 'description' does not exist on ExtendedLead
        }
      };
      setCustomPayload(JSON.stringify(defaultPayload, null, 2));
    }
  }, [lead, customPayload]);

  // Generar comandos curl y fetch cuando cambian los parámetros
  useEffect(() => {
    if (selectedFlow) {
      generateHttpExamples();
    }
  }, [selectedFlow, method, endpoint, customPayload]);

  const generateHttpExamples = async () => {
    if (!selectedFlow) return;

    try {
      const flow = manualFlows.find(f => f.id === selectedFlow);
      if (!flow) return;

      const baseUrl = window.location.origin;
      const identifier = endpoint === 'alias' ? (flow.alias || flow.id) : flow.id;
      const url = `${baseUrl}/api/flows/dev-execute/${identifier}`;

      if (method === 'GET') {
        // GET curl (sin autenticación)
        const curlCommand = `curl -X GET "${url}" \\
  -H "Content-Type: application/json"`;

        // GET fetch (sin autenticación)
        const fetchCode = `fetch('${url}', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

        setGeneratedCurl(curlCommand);
        setGeneratedFetch(fetchCode);
      } else {
        // POST curl (sin autenticación)
        const curlCommand = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${customPayload.replace(/'/g, "\\'")}'`;

        // POST fetch (sin autenticación)
        const fetchCode = `fetch('${url}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: \`${customPayload}\`
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

        setGeneratedCurl(curlCommand);
        setGeneratedFetch(fetchCode);
      }
    } catch (error) {
      console.error('Error generating examples:', error);
    }
  };

  const executeFlow = async () => {
    if (!selectedFlow) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const flow = manualFlows.find(f => f.id === selectedFlow);
      if (!flow) throw new Error('Flow not found');

      const identifier = endpoint === 'alias' ? (flow.alias || flow.id) : flow.id;
      const url = `/api/flows/dev-execute/${identifier}`;

      let response;
      if (method === 'GET') {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        const payload = customPayload ? JSON.parse(customPayload) : {};
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputData: payload })
        });
      }

      const result = await response.json();
      setExecutionResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "✅ Flujo ejecutado exitosamente",
          description: `${flow.name} se ejecutó correctamente`
        });
      } else {
        toast({
          title: "❌ Error en la ejecución",
          description: result.error || "Error desconocido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({
        success: false,
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Error desconocido' },
        timestamp: new Date().toISOString()
      });
      toast({
        title: "❌ Error en la ejecución",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copiado al portapapeles",
      description: `Código ${type} copiado exitosamente`
    });
  };

  const selectedFlowData = manualFlows.find(f => f.id === selectedFlow);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-blue-400" />
            Testing de Flujos con HTTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selección de flujo */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="flow-select" className="text-gray-300">Flujo</Label>
                  <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar flujo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {manualFlows.map(flow => (
                        <SelectItem key={flow.id} value={flow.id} className="text-white">
                          {flow.name}
                          {flow.alias && (
                            <Badge variant="secondary" className="ml-2">
                              {flow.alias}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method-select" className="text-gray-300">Método HTTP</Label>
                  <Select value={method} onValueChange={(value) => setMethod(value as 'GET' | 'POST')}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="GET" className="text-white">GET</SelectItem>
                      <SelectItem value="POST" className="text-white">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endpoint-select" className="text-gray-300">Endpoint</Label>
                  <Select value={endpoint} onValueChange={(value) => setEndpoint(value as 'id' | 'alias')}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="alias" className="text-white">Por Alias</SelectItem>
                      <SelectItem value="id" className="text-white">Por ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedFlowData && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-white">Información del Flujo</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div><strong>Nombre:</strong> {selectedFlowData.name}</div>
                    <div><strong>ID:</strong> <code className="bg-gray-800 px-1 rounded">{selectedFlowData.id}</code></div>
                    {selectedFlowData.alias && (
                      <div><strong>Alias:</strong> <code className="bg-gray-800 px-1 rounded">{selectedFlowData.alias}</code></div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payload para POST */}
          {method === 'POST' && (
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Payload JSON
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Datos que se enviarán al flujo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder="Ingresa el payload JSON..."
                  className="bg-gray-700 border-gray-600 text-white font-mono text-sm min-h-[150px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Botón de ejecución */}
          <div className="flex justify-center">
            <Button
              onClick={executeFlow}
              disabled={!selectedFlow || isExecuting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Flujo
                </>
              )}
            </Button>
          </div>

          {/* Códigos de ejemplo */}
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="curl" className="data-[state=active]:bg-gray-700">
                <Terminal className="h-4 w-4 mr-2" />
                cURL
              </TabsTrigger>
              <TabsTrigger value="fetch" className="data-[state=active]:bg-gray-700">
                <Globe className="h-4 w-4 mr-2" />
                JavaScript Fetch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <Card className="bg-gray-800 border border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Comando cURL</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCurl, 'cURL')}
                    className="border-gray-600 text-gray-300"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-black rounded p-4 text-green-400 text-sm overflow-x-auto">
                    <code>{generatedCurl}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fetch">
              <Card className="bg-gray-800 border border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">JavaScript Fetch</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedFetch, 'JavaScript')}
                    className="border-gray-600 text-gray-300"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-black rounded p-4 text-blue-400 text-sm overflow-x-auto">
                    <code>{generatedFetch}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Resultados de ejecución */}
          {executionResult && (
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {executionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  Resultado de Ejecución
                  <Badge 
                    variant={executionResult.success ? "default" : "destructive"}
                    className="ml-2"
                  >
                    HTTP {executionResult.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-400">
                    Ejecutado el: {new Date(executionResult.timestamp).toLocaleString()}
                  </div>
                  <Separator className="bg-gray-700" />
                  <pre className="bg-black rounded p-4 text-sm overflow-auto max-h-96">
                    <code className={executionResult.success ? "text-green-400" : "text-red-400"}>
                      {JSON.stringify(executionResult.data, null, 2)}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}