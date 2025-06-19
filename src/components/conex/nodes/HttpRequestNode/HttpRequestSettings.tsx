import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Copy, FileText, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HttpRequestConfig, HttpRequestConfigSchema } from './schema';
import { COMMON_HEADERS, EXAMPLE_CONFIGS, METHOD_COLORS } from './constants';

interface HttpRequestSettingsProps {
  config: HttpRequestConfig;
  onChange: (config: HttpRequestConfig) => void;
}

export function HttpRequestSettings({ config, onChange }: HttpRequestSettingsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Manejar cambios en la configuración
  const updateConfig = (updates: Partial<HttpRequestConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Validar configuración antes de aplicar
    const validation = HttpRequestConfigSchema.safeParse(newConfig);
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

  // Manejar headers dinámicos
  const addHeader = () => {
    const headers = { ...config.headers };
    headers['Nueva-Header'] = 'valor';
    updateConfig({ headers });
  };

  const removeHeader = (key: string) => {
    const headers = { ...config.headers };
    delete headers[key];
    updateConfig({ headers });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const headers = { ...config.headers };
    if (oldKey !== newKey) {
      delete headers[oldKey];
    }
    headers[newKey] = value;
    updateConfig({ headers });
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

  // Formatear JSON del body
  const formatBodyJson = () => {
    try {
      if (typeof config.body === 'string') {
        const parsed = JSON.parse(config.body);
        updateConfig({ body: parsed });
      } else if (config.body) {
        updateConfig({ body: config.body });
      }
      toast({
        title: 'JSON Formateado',
        description: 'El body ha sido formateado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error de JSON',
        description: 'El body no contiene JSON válido',
        variant: 'destructive',
      });
    }
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
              onClick={() => applyExample('simpleGet')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📥 GET Simple
            </Button>
            <Button
              onClick={() => applyExample('postWithAuth')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔐 POST + Auth
            </Button>
            <Button
              onClick={() => applyExample('webhook')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🪝 Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs">Headers</TabsTrigger>
          <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Método y URL */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-gray-300 text-xs">Método HTTP</Label>
              <Select
                value={config.method}
                onValueChange={(method: any) => updateConfig({ method })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {Object.entries(METHOD_COLORS).map(([method, color]) => (
                    <SelectItem key={method} value={method} className={`${color} hover:bg-gray-700`}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">URL del Endpoint</Label>
              <Input
                value={config.url}
                onChange={(e) => updateConfig({ url: e.target.value })}
                placeholder="https://api.ejemplo.com/endpoint"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Preview de la petición */}
          <Card className="bg-gray-900 border-gray-600">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge className={`${METHOD_COLORS[config.method]} bg-transparent border-current`}>
                  {config.method}
                </Badge>
                <code className="text-gray-300 text-xs truncate flex-1">
                  {config.url || 'URL no configurada'}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headers" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-300">Headers HTTP</Label>
            <Button
              onClick={addHeader}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(config.headers || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                <Input
                  value={key}
                  onChange={(e) => updateHeader(key, e.target.value, value)}
                  placeholder="Header-Name"
                  className="bg-gray-700 border-gray-600 text-gray-100 text-xs flex-1"
                />
                <Input
                  value={value}
                  onChange={(e) => updateHeader(key, key, e.target.value)}
                  placeholder="valor"
                  className="bg-gray-700 border-gray-600 text-gray-100 text-xs flex-1"
                />
                <Button
                  onClick={() => removeHeader(key)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {Object.keys(config.headers || {}).length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No hay headers configurados
              </div>
            )}
          </div>

          {/* Headers comunes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">💡 Headers Comunes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(COMMON_HEADERS).map(([headerName, suggestions]) => (
                <div key={headerName} className="space-y-1">
                  <Label className="text-xs text-gray-400">{headerName}:</Label>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <Button
                        key={suggestion}
                        onClick={() => {
                          const headers = { ...config.headers };
                          headers[headerName] = suggestion;
                          updateConfig({ headers });
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2 text-gray-400 hover:text-gray-200"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="body" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-300">Request Body</Label>
            <div className="flex gap-2">
              <Button
                onClick={formatBodyJson}
                size="sm"
                variant="outline"
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Code className="h-3 w-3 mr-1" />
                Formatear JSON
              </Button>
            </div>
          </div>

          <Textarea
            value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateConfig({ body: parsed });
              } catch {
                updateConfig({ body: e.target.value });
              }
            }}
            placeholder={`{
  "name": "{{trigger.input.leadName}}",
  "email": "{{trigger.input.leadEmail}}",
  "source": "CRM"
}`}
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono text-xs"
            rows={8}
          />

          <div className="text-xs text-gray-400">
            💡 <strong>Variables disponibles:</strong> {`{{trigger.input.campo}}`}, {`{{step_nodeId.respuesta}}`}, {`{{connections.api.token}}`}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Timeouts y reintentos */}
          <div className="grid grid-cols-2 gap-4">
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
              <div className="text-xs text-gray-400 mt-1">Máximo: 300 segundos</div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Reintentos</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={config.retries || 1}
                onChange={(e) => updateConfig({ retries: parseInt(e.target.value) || 1 })}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
              <div className="text-xs text-gray-400 mt-1">Máximo: 10 reintentos</div>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 text-sm">Seguir Redirecciones</Label>
                <div className="text-xs text-gray-400">Permite redirecciones automáticas (30x)</div>
              </div>
              <Switch
                checked={config.followRedirects ?? true}
                onCheckedChange={(followRedirects) => updateConfig({ followRedirects })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 text-sm">Validar SSL</Label>
                <div className="text-xs text-gray-400">Verificar certificados SSL/TLS</div>
              </div>
              <Switch
                checked={config.validateSSL ?? true}
                onCheckedChange={(validateSSL) => updateConfig({ validateSSL })}
              />
            </div>
          </div>

          {/* Información de configuración */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-300">📊 Resumen de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <div>• Método: <span className={METHOD_COLORS[config.method]}>{config.method}</span></div>
              <div>• Headers: {Object.keys(config.headers || {}).length} configurados</div>
              <div>• Body: {config.body ? 'Configurado' : 'Vacío'}</div>
              <div>• Timeout: {config.timeout || 30}s con {config.retries || 1} reintentos</div>
              <div>• Redirecciones: {config.followRedirects ? 'Permitidas' : 'Bloqueadas'}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}