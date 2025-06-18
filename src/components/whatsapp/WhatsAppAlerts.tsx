"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  RefreshCw,
  MessageCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';

interface WhatsAppAlert {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  instanceId?: string;
}

interface WhatsAppStatus {
  hasInstances: boolean;
  webhookConfigured: boolean;
  activeInstances: number;
  totalInstances?: number;
  alerts: WhatsAppAlert[];
  instances?: Array<{
    id: string;
    name: string;
    status: string;
    lastActivity?: string;
  }>;
}

export function WhatsAppAlerts() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const loadStatus = async () => {
    if (!user || !currentOrganization?.id) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/whatsapp/webhook-status?organizationId=${currentOrganization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      } else {
        throw new Error(result.error || 'Error al cargar estado');
      }
    } catch (error) {
      console.error('Error loading WhatsApp status:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de WhatsApp",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };


  const handleAlertAction = (alert: WhatsAppAlert) => {
    if (alert.action === 'Ir a Configuración' || alert.action === 'Configurar Webhook') {
      // Navegar a la configuración de WhatsApp
      window.location.href = '/config';
    } else if (alert.action === 'Reconectar' || alert.action === 'Verificar Estado') {
      // Recargar el estado
      loadStatus();
    }
  };

  useEffect(() => {
    loadStatus();
  }, [user, currentOrganization]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verificando estado de WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Estado General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Estado de WhatsApp
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStatus}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              {status.hasInstances ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {status.hasInstances ? 'Instancias configuradas' : 'Sin instancias'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={status.webhookConfigured ? 'default' : 'destructive'}>
                {status.webhookConfigured ? 'Webhook OK' : 'Webhook no configurado'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={status.activeInstances > 0 ? 'default' : 'secondary'}>
                {status.activeInstances} de {status.totalInstances || 0} activas
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {status.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas ({status.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.alerts.map((alert, index) => (
              <Alert 
                key={index}
                className={`${
                  alert.type === 'error' 
                    ? 'border-red-200 bg-red-50' 
                    : alert.type === 'warning'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                {getAlertIcon(alert.type)}
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                  {alert.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert)}
                    >
                      {alert.action}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Estado de Instancias */}
      {status.instances && status.instances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Instancias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      instance.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{instance.name}</span>
                    <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                      {instance.status === 'connected' ? 'Conectada' : 'Desconectada'}
                    </Badge>
                  </div>
                  {instance.lastActivity && (
                    <span className="text-xs text-muted-foreground">
                      Última actividad: {new Date(instance.lastActivity).toLocaleString('es-ES')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}