"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  QrCode, 
  Settings, 
  Trash2, 
  RefreshCw,
  Phone,
  Clock
} from 'lucide-react';
import type { WhatsAppInstance } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  onUpdate: (instance: WhatsAppInstance) => void;
  onDelete: (instanceId: string) => void;
}

export function WhatsAppInstanceCard({ instance, onUpdate, onDelete }: WhatsAppInstanceCardProps) {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Error';
    }
  };

  const handleStatusAction = async (action: 'connect' | 'disconnect' | 'refresh') => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: instance.organizationId,
          instanceId: instance.id,
          action
        })
      });

      const result = await response.json();

      if (result.success) {
        if (action === 'connect' && result.data?.qrCode) {
          setQrCode(result.data.qrCode);
          setShowQR(true);
        }
        
        // Update instance status
        const updatedInstance = {
          ...instance,
          connectionStatus: result.data?.connectionStatus || (action === 'disconnect' ? 'disconnected' : 'connecting'),
          lastStatusCheck: new Date().toISOString()
        };
        onUpdate(updatedInstance);

        toast({
          title: "Éxito",
          description: result.message || `Acción ${action} completada`,
        });
      } else {
        throw new Error(result.message || 'Error en la operación');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta instancia?')) {
      onDelete(instance.id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {instance.instanceName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary"
                className={`${getStatusColor(instance.connectionStatus)} text-white`}
              >
                {instance.connectionStatus === 'connected' ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {getStatusText(instance.connectionStatus)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">URL Webhook:</p>
              <p className="font-mono text-xs truncate">{instance.webhookUrl}</p>
            </div>
            <div>
              <p className="text-muted-foreground">API Key:</p>
              <p className="font-mono text-xs">***{instance.apiKey.slice(-4)}</p>
            </div>
          </div>

          {instance.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{instance.phoneNumber}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última verificación: {formatDate(instance.lastStatusCheck)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('refresh')}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Verificar
            </Button>

            {instance.connectionStatus === 'disconnected' && (
              <Button
                size="sm"
                onClick={() => handleStatusAction('connect')}
                disabled={loading}
              >
                <QrCode className="h-4 w-4 mr-1" />
                Conectar
              </Button>
            )}

            {instance.connectionStatus === 'connected' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusAction('disconnect')}
                disabled={loading}
              >
                <WifiOff className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>

          {instance.settings.antiSpam.enabled && (
            <Alert>
              <AlertDescription>
                Anti-spam activado: máximo {instance.settings.antiSpam.maxMessagesPerHour} mensajes por hora
                con enfriamiento de {instance.settings.antiSpam.cooldownMinutes} minutos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Escanea el código QR</h3>
            <div className="flex justify-center mb-4">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Abre WhatsApp en tu teléfono, ve a Dispositivos vinculados y escanea este código.
            </p>
            <Button 
              onClick={() => setShowQR(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}