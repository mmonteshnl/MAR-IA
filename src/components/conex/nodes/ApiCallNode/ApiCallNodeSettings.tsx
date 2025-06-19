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
import { Plus, Trash2, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ApiCallNodeConfig, ApiCallNodeConfigSchema } from './schema';

interface ApiCallNodeSettingsProps {
  config: ApiCallNodeConfig;
  onChange: (config: ApiCallNodeConfig) => void;
}

const METHOD_COLORS = {
  GET: 'text-blue-400',
  POST: 'text-green-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
};

const COMMON_HEADERS = {
  'Content-Type': ['application/json', 'application/x-www-form-urlencoded', 'text/plain'],
  'Accept': ['application/json', '*/*', 'text/html'],
  'User-Agent': ['MyApp/1.0', 'Mozilla/5.0', 'Custom-Agent'],
};

export function ApiCallNodeSettings({ config, onChange }: ApiCallNodeSettingsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const updateConfig = (updates: Partial<ApiCallNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    const validation = ApiCallNodeConfigSchema.safeParse(newConfig);
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

  const formatBodyJson = () => {
    try {
      if (config.body) {
        const parsed = JSON.parse(config.body);
        updateConfig({ body: JSON.stringify(parsed, null, 2) });
        toast({
          title: 'JSON Formateado',
          description: 'El body ha sido formateado correctamente',
        });
      }
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs">Headers</TabsTrigger>
          <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
          <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Nombre del Nodo</Label>
            <Input
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="Llamada API"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>

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
                    <SelectItem key={method} value={method} className={`${color}`}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300 text-xs">URL del Endpoint</Label>
              <Input
                value={config.url || ''}
                onChange={(e) => updateConfig({ url: e.target.value })}
                placeholder="https://api.ejemplo.com/endpoint"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 text-xs">Timeout (ms)</Label>
              <Input
                type="number"
                min="1000"
                max="30000"
                value={config.timeout}
                onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 10000 })}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Reintentos</Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={config.retries}
                onChange={(e) => updateConfig({ retries: parseInt(e.target.value) || 0 })}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
          </div>
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
        </TabsContent>

        <TabsContent value="body" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-300">Request Body</Label>
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

          <Textarea
            value={config.body || ''}
            onChange={(e) => updateConfig({ body: e.target.value })}
            placeholder={`{
  "name": "{{trigger.input.leadName}}",
  "email": "{{trigger.input.leadEmail}}"
}`}
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono text-xs"
            rows={8}
          />
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Tipo de Autenticación</Label>
            <Select
              value={config.authentication?.type || 'none'}
              onValueChange={(type: any) => updateConfig({ 
                authentication: { ...config.authentication, type } 
              })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="none">Sin autenticación</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="api-key">API Key</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.authentication?.type === 'bearer' && (
            <div>
              <Label className="text-gray-300 text-xs">Bearer Token</Label>
              <Input
                type="password"
                value={config.authentication.token || ''}
                onChange={(e) => updateConfig({ 
                  authentication: { ...config.authentication, token: e.target.value }
                })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
          )}

          {config.authentication?.type === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-xs">Usuario</Label>
                <Input
                  value={config.authentication.username || ''}
                  onChange={(e) => updateConfig({ 
                    authentication: { ...config.authentication, username: e.target.value }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Contraseña</Label>
                <Input
                  type="password"
                  value={config.authentication.password || ''}
                  onChange={(e) => updateConfig({ 
                    authentication: { ...config.authentication, password: e.target.value }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
            </div>
          )}

          {config.authentication?.type === 'api-key' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-xs">Header Name</Label>
                <Input
                  value={config.authentication.apiKeyHeader || ''}
                  onChange={(e) => updateConfig({ 
                    authentication: { ...config.authentication, apiKeyHeader: e.target.value }
                  })}
                  placeholder="X-API-Key"
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">API Key</Label>
                <Input
                  type="password"
                  value={config.authentication.apiKey || ''}
                  onChange={(e) => updateConfig({ 
                    authentication: { ...config.authentication, apiKey: e.target.value }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}