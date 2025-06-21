import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2,
  AlertTriangle,
  TestTube
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppConfig {
  instanceId: string;
  phoneNumber: string;
  message: string;
  messageTemplate: string;
  useTemplate: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  webhookPort: string;
  variables: {
    [key: string]: string;
  };
}

interface WhatsAppNodeSettingsProps {
  config: WhatsAppConfig;
  onUpdate: (config: WhatsAppConfig) => void;
}

export const WhatsAppNodeSettings: React.FC<WhatsAppNodeSettingsProps> = ({ 
  config, 
  onUpdate 
}) => {
  const [localConfig, setLocalConfig] = useState<WhatsAppConfig>(config);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [newVariableKey, setNewVariableKey] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');

  useEffect(() => {
    loadWhatsAppInstances();
  }, []);

  const loadWhatsAppInstances = async () => {
    setIsLoadingInstances(true);
    try {
      const response = await fetch('/api/whatsapp/instances');
      if (response.ok) {
        const data = await response.json();
        setAvailableInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Error loading WhatsApp instances:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las instancias de WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const testConnection = async () => {
    if (!localConfig.instanceId) {
      toast({
        title: 'Error',
        description: 'Selecciona una instancia de WhatsApp primero',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/whatsapp/webhook-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceId: localConfig.instanceId,
          webhookPort: localConfig.webhookPort 
        })
      });

      const result = await response.json();
      
      const newStatus = result.connected ? 'connected' : 'disconnected';
      const updatedConfig = { ...localConfig, connectionStatus: newStatus };
      setLocalConfig(updatedConfig);
      onUpdate(updatedConfig);

      toast({
        title: result.connected ? 'Conexión Exitosa' : 'Sin Conexión',
        description: result.message || (result.connected ? 
          'WhatsApp webhook conectado correctamente' : 
          'No se pudo conectar al webhook de WhatsApp'
        ),
        variant: result.connected ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      const updatedConfig = { ...localConfig, connectionStatus: 'disconnected' as const };
      setLocalConfig(updatedConfig);
      onUpdate(updatedConfig);
      
      toast({
        title: 'Error de Conexión',
        description: 'No se pudo verificar la conexión del webhook',
        variant: 'destructive'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestMessage = async () => {
    if (!localConfig.instanceId || !localConfig.phoneNumber) {
      toast({
        title: 'Error',
        description: 'Configura la instancia y número de teléfono primero',
        variant: 'destructive'
      });
      return;
    }

    try {
      const testMessage = localConfig.useTemplate 
        ? processTemplate(localConfig.messageTemplate, localConfig.variables)
        : localConfig.message;

      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'test', // This should come from context
          instanceId: localConfig.instanceId,
          message: {
            number: localConfig.phoneNumber,
            text: testMessage
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Mensaje de Prueba Enviado',
          description: 'El mensaje se envió correctamente',
        });
      } else {
        throw new Error(result.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar el mensaje de prueba',
        variant: 'destructive'
      });
    }
  };

  const processTemplate = (template: string, variables: { [key: string]: string }) => {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });
    return processed;
  };

  const addVariable = () => {
    if (newVariableKey && newVariableValue) {
      const updatedConfig = {
        ...localConfig,
        variables: {
          ...localConfig.variables,
          [newVariableKey]: newVariableValue
        }
      };
      setLocalConfig(updatedConfig);
      onUpdate(updatedConfig);
      setNewVariableKey('');
      setNewVariableValue('');
    }
  };

  const removeVariable = (key: string) => {
    const { [key]: removed, ...remainingVariables } = localConfig.variables;
    const updatedConfig = {
      ...localConfig,
      variables: remainingVariables
    };
    setLocalConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const handleConfigChange = (key: keyof WhatsAppConfig, value: any) => {
    const updatedConfig = { ...localConfig, [key]: value };
    setLocalConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const getConnectionStatusColor = () => {
    switch (localConfig.connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionIcon = () => {
    switch (localConfig.connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Estado de Conexión WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                {localConfig.connectionStatus === 'connected' ? 'Conectado' :
                 localConfig.connectionStatus === 'disconnected' ? 'Desconectado' : 'Desconocido'}
              </span>
              {localConfig.webhookPort && (
                <Badge variant="outline">Puerto: {localConfig.webhookPort}</Badge>
              )}
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              size="sm"
              variant="outline"
            >
              {isTestingConnection ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              Probar Conexión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instance Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="instanceId">Instancia de WhatsApp</Label>
          <div className="flex gap-2">
            <Select 
              value={localConfig.instanceId} 
              onValueChange={(value) => handleConfigChange('instanceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una instancia" />
              </SelectTrigger>
              <SelectContent>
                {availableInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.name} ({instance.phoneNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={loadWhatsAppInstances} 
              disabled={isLoadingInstances}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingInstances ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="phoneNumber">Número de Teléfono (para pruebas)</Label>
          <Input
            id="phoneNumber"
            value={localConfig.phoneNumber}
            onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
            placeholder="+1234567890"
          />
        </div>

        <div>
          <Label htmlFor="webhookPort">Puerto del Webhook</Label>
          <Input
            id="webhookPort"
            value={localConfig.webhookPort}
            onChange={(e) => handleConfigChange('webhookPort', e.target.value)}
            placeholder="8000"
          />
        </div>
      </div>

      <Separator />

      {/* Message Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Configuración del Mensaje</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={localConfig.useTemplate}
              onCheckedChange={(checked) => handleConfigChange('useTemplate', checked)}
            />
            <Label className="text-sm">Usar Plantilla</Label>
          </div>
        </div>

        {localConfig.useTemplate ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="messageTemplate">Plantilla del Mensaje</Label>
              <Textarea
                id="messageTemplate"
                value={localConfig.messageTemplate}
                onChange={(e) => handleConfigChange('messageTemplate', e.target.value)}
                placeholder="Hola {{nombre}}, tu pedido {{numero}} está listo..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa {{variable}} para insertar variables dinámicas
              </p>
            </div>

            {/* Variables */}
            <div>
              <Label>Variables</Label>
              <div className="space-y-2">
                {Object.entries(localConfig.variables || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline">{{key}}</Badge>
                    <Input
                      value={value}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...localConfig,
                          variables: {
                            ...localConfig.variables,
                            [key]: e.target.value
                          }
                        };
                        setLocalConfig(updatedConfig);
                        onUpdate(updatedConfig);
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeVariable(key)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    value={newVariableKey}
                    onChange={(e) => setNewVariableKey(e.target.value)}
                    placeholder="nombre"
                    className="w-32"
                  />
                  <Input
                    value={newVariableValue}
                    onChange={(e) => setNewVariableValue(e.target.value)}
                    placeholder="Valor por defecto"
                    className="flex-1"
                  />
                  <Button onClick={addVariable} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <div>
              <Label>Vista Previa</Label>
              <div className="bg-gray-100 p-3 rounded border text-sm">
                {processTemplate(localConfig.messageTemplate, localConfig.variables)}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={localConfig.message}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[100px]"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Test Section */}
      <div className="space-y-2">
        <Button 
          onClick={sendTestMessage} 
          className="w-full"
          variant="outline"
          disabled={!localConfig.instanceId || !localConfig.phoneNumber}
        >
          <TestTube className="w-4 h-4 mr-2" />
          Enviar Mensaje de Prueba
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Esto enviará el mensaje configurado al número especificado
        </p>
      </div>
    </div>
  );
};