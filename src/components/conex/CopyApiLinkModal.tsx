import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Code, Play, Info, Zap, Globe } from 'lucide-react';

interface CopyApiLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: string;
  flowName: string;
  flowAlias?: string;
}

interface EndpointOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  curlCommand: string;
  badge?: string;
  color: string;
}

export function CopyApiLinkModal({ isOpen, onClose, flowId, flowName, flowAlias }: CopyApiLinkModalProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3047';
  
  // Generar alias automáticamente si no existe (para flujos anteriores)
  const generateAlias = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
      .replace(/\s+/g, '-')        // Espacios a guiones
      .replace(/-+/g, '-')         // Múltiples guiones a uno
      .replace(/^-|-$/g, '')       // Quitar guiones al inicio/final
      + '-v1';                     // Agregar versión
  };
  
  const effectiveAlias = flowAlias || generateAlias(flowName);

  const endpoints: EndpointOption[] = [
    {
      id: 'info',
      title: 'Información del Flujo',
      description: 'Obtiene metadatos, estructura y configuración del flujo por ID',
      icon: <Info className="h-5 w-5" />,
      badge: 'GET',
      color: 'blue',
      curlCommand: `curl -X GET "${baseUrl}/api/flows/dev-execute?id=${flowId}" \\
  -H "Accept: application/json"`
    },
    {
      id: 'info-alias',
      title: 'Información por Alias',
      description: 'Obtiene información del flujo usando alias estable (recomendado para integraciones)',
      icon: <Info className="h-5 w-5" />,
      badge: 'GET',
      color: 'blue',
      curlCommand: `curl -X GET "${baseUrl}/api/flows/dev-execute?alias=${effectiveAlias}" \\
  -H "Accept: application/json"`
    },
    {
      id: 'execute',
      title: 'Ejecutar Flujo con ID',
      description: 'Ejecuta el flujo usando su ID técnico con datos personalizados',
      icon: <Play className="h-5 w-5" />,
      badge: 'POST',
      color: 'green',
      curlCommand: `curl -X POST "${baseUrl}/api/flows/dev-execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flowId": "${flowId}",
    "inputData": {
      "leadName": "John Doe",
      "leadEmail": "john@example.com",
      "leadPhone": "+1234567890",
      "leadIndustry": "Technology",
      "leadValue": 25000,
      "leadSource": "API"
    }
  }'`
    },
    {
      id: 'execute-alias',
      title: 'Ejecutar con Alias Estable',
      description: 'Ejecuta el flujo usando alias que nunca cambia (ideal para integraciones)',
      icon: <Play className="h-5 w-5" />,
      badge: 'STABLE',
      color: 'emerald',
      curlCommand: `curl -X POST "${baseUrl}/api/flows/dev-execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flowAlias": "${effectiveAlias}",
    "inputData": {
      "leadName": "John Doe",
      "leadEmail": "john@example.com",
      "leadPhone": "+1234567890",
      "leadIndustry": "Technology",
      "leadValue": 25000,
      "leadSource": "API"
    }
  }'`
    },
    {
      id: 'webhook-style',
      title: 'Estilo Webhook/Integración',
      description: 'Formato profesional para webhooks con alias estable',
      icon: <Globe className="h-5 w-5" />,
      badge: 'WEBHOOK',
      color: 'orange',
      curlCommand: `curl -X POST "${baseUrl}/api/flows/dev-execute" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: MyApp/1.0" \\
  -d '{
    "flowAlias": "${effectiveAlias}",
    "inputData": {
      "event": "lead_created",
      "lead": {
        "name": "Nueva Empresa S.A.",
        "email": "contacto@nuevaempresa.com",
        "phone": "+52-555-123-4567",
        "website": "https://nuevaempresa.com",
        "industry": "Retail",
        "value": 15000,
        "source": "Website Form",
        "campaign": "Q1-2025-Digital"
      },
      "metadata": {
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "source": "webhook",
        "version": "1.0"
      }
    }
  }'`
    }
  ];

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      toast({
        title: '✅ Copiado',
        description: `${type} copiado al portapapeles`,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive',
      });
    }
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-900/50 text-blue-300 border-blue-700',
      green: 'bg-green-900/50 text-green-300 border-green-700',
      emerald: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
      purple: 'bg-purple-900/50 text-purple-300 border-purple-700',
      orange: 'bg-orange-900/50 text-orange-300 border-orange-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getCardBorder = (color: string, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-700 hover:border-gray-600';
    
    const borders = {
      blue: 'border-blue-500 ring-2 ring-blue-500/20',
      green: 'border-green-500 ring-2 ring-green-500/20',
      emerald: 'border-emerald-500 ring-2 ring-emerald-500/20',
      purple: 'border-purple-500 ring-2 ring-purple-500/20',
      orange: 'border-orange-500 ring-2 ring-orange-500/20'
    };
    return borders[color as keyof typeof borders] || borders.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-blue-400" />
            API Links para: {flowName}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Selecciona el tipo de endpoint que necesitas y copia el comando cURL listo para usar. 
            <span className="text-emerald-400 font-medium">Los endpoints con "ALIAS" ofrecen máxima estabilidad para integraciones.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Grid de opciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endpoints.map((endpoint) => (
              <Card 
                key={endpoint.id}
                className={`cursor-pointer transition-all duration-200 bg-gray-800 border-gray-700 hover:bg-gray-750 ${getCardBorder(endpoint.color, selectedEndpoint === endpoint.id)}`}
                onClick={() => setSelectedEndpoint(endpoint.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${endpoint.color}-900/50 text-${endpoint.color}-400`}>
                        {endpoint.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">{endpoint.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {endpoint.badge && (
                            <Badge className={`text-xs bg-${endpoint.color}-900/50 text-${endpoint.color}-300 border-${endpoint.color}-700`}>
                              {endpoint.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-400">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Detalles del endpoint seleccionado */}
          {selectedEndpoint && (
            <div className="mt-6 space-y-4">
              {(() => {
                const endpoint = endpoints.find(e => e.id === selectedEndpoint);
                if (!endpoint) return null;

                return (
                  <Card className="border-2 border-blue-500 bg-gray-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-400">
                        {endpoint.icon}
                        {endpoint.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Comando cURL */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-200">Comando cURL - Listo para Terminal:</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(endpoint.curlCommand, 'cURL')}
                            className="h-7 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                          >
                            {copied === 'cURL' ? (
                              '✅ Copiado'
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar cURL
                              </>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={endpoint.curlCommand}
                          readOnly
                          className="font-mono text-xs resize-none bg-black text-green-400 border-gray-600"
                          rows={endpoint.id === 'info' ? 3 : 15}
                        />
                      </div>

                      {/* Instrucciones adicionales */}
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                        <h4 className="font-medium text-blue-300 mb-2">📋 Instrucciones:</h4>
                        <ul className="text-sm text-blue-200 space-y-1">
                          {endpoint.id === 'info' && (
                            <>
                              <li>• 📋 Obtiene información completa del flujo por ID</li>
                              <li>• 🔍 Verifica estructura y configuración</li>
                              <li>• 💡 Usa antes de ejecutar para revisar nodos</li>
                              <li>• ⚠️ El ID puede cambiar si recreas el flujo</li>
                            </>
                          )}
                          {endpoint.id === 'info-alias' && (
                            <>
                              <li>• 🔒 Obtiene información usando alias estable</li>
                              <li>• ✅ El alias NUNCA cambia una vez asignado</li>
                              <li>• 🎯 Ideal para integraciones y automatización</li>
                              {!flowAlias && (
                                <li>• ⚠️ Este alias es generado - considera asignar uno permanente</li>
                              )}
                              {flowAlias && (
                                <li>• ✅ Alias permanente asignado al flujo</li>
                              )}
                            </>
                          )}
                          {endpoint.id === 'execute' && (
                            <>
                              <li>• ▶️ Ejecuta tu flujo guardado con datos reales</li>
                              <li>• ✏️ Cambia leadName, email, industry, etc.</li>
                              <li>• 🌐 Nodos HTTP harán llamadas reales a APIs</li>
                              <li>• ⚠️ Usa ID técnico (puede cambiar)</li>
                            </>
                          )}
                          {endpoint.id === 'execute-alias' && (
                            <>
                              <li>• 🔒 Ejecuta flujo con identificador estable</li>
                              <li>• ✅ Alias nunca cambia - integraciones seguras</li>
                              <li>• 🎯 Recomendado para Postman, webhooks, CI/CD</li>
                              {!flowAlias && (
                                <li>• ⚠️ Usando alias generado: {effectiveAlias}</li>
                              )}
                              {flowAlias && (
                                <li>• ✅ Usando alias permanente: {effectiveAlias}</li>
                              )}
                              <li>• 💎 Mejor práctica para sistemas externos</li>
                            </>
                          )}
                          {endpoint.id === 'webhook-style' && (
                            <>
                              <li>• 🔗 Formato profesional para integraciones</li>
                              <li>• 📅 Incluye metadata y timestamp</li>
                              <li>• 🚀 Perfecto para webhooks y automatización</li>
                              {!flowAlias && (
                                <li>• ⚠️ Usando alias generado: {effectiveAlias}</li>
                              )}
                              {flowAlias && (
                                <li>• ✅ Usando alias permanente: {effectiveAlias}</li>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            💡 Tip: Usa endpoints con <span className="text-emerald-400 font-medium">ALIAS</span> para integraciones estables
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white">
              <a 
                href="https://github.com/anthropics/claude-code" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Documentación
              </a>
            </Button>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}