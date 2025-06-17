"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Clock, Shield, Globe } from 'lucide-react';
import type { WhatsAppInstance } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';

interface CreateInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated: (instance: WhatsAppInstance) => void;
}

export function CreateInstanceModal({ open, onOpenChange, onInstanceCreated }: CreateInstanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instanceName: '',
    webhookUrl: '',
    apiKey: '',
    autoReply: false,
    businessHours: {
      enabled: false,
      timezone: 'America/Panama',
    },
    antiSpam: {
      enabled: true,
      cooldownMinutes: 60,
      maxMessagesPerHour: 5
    }
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  const timezones = [
    { value: 'America/Panama', label: 'Panamá (GMT-5)' },
    { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !organizationId) {
      toast({
        title: "Error",
        description: "No se pudo autenticar al usuario",
        variant: "destructive"
      });
      return;
    }

    if (!formData.instanceName.trim() || !formData.webhookUrl.trim() || !formData.apiKey.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      const instanceData = {
        instanceName: formData.instanceName.trim(),
        webhookUrl: formData.webhookUrl.trim(),
        apiKey: formData.apiKey.trim(),
        settings: {
          autoReply: formData.autoReply,
          businessHours: {
            enabled: formData.businessHours.enabled,
            timezone: formData.businessHours.timezone,
            schedule: [
              { day: 'monday', start: '09:00', end: '18:00', enabled: true },
              { day: 'tuesday', start: '09:00', end: '18:00', enabled: true },
              { day: 'wednesday', start: '09:00', end: '18:00', enabled: true },
              { day: 'thursday', start: '09:00', end: '18:00', enabled: true },
              { day: 'friday', start: '09:00', end: '18:00', enabled: true },
              { day: 'saturday', start: '09:00', end: '14:00', enabled: false },
              { day: 'sunday', start: '09:00', end: '14:00', enabled: false },
            ]
          },
          antiSpam: formData.antiSpam
        }
      };
      
      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          instanceData
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Instancia de WhatsApp creada exitosamente",
        });
        
        onInstanceCreated(result.data);
        onOpenChange(false);
        
        // Reset form
        setFormData({
          instanceName: '',
          webhookUrl: '',
          apiKey: '',
          autoReply: false,
          businessHours: {
            enabled: false,
            timezone: 'America/Panama',
          },
          antiSpam: {
            enabled: true,
            cooldownMinutes: 60,
            maxMessagesPerHour: 5
          }
        });
      } else {
        throw new Error(result.message || 'Error al crear instancia');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nueva Instancia de WhatsApp
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Configuración Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instanceName">Nombre de la Instancia</Label>
                <Input
                  id="instanceName"
                  value={formData.instanceName}
                  onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                  placeholder="ej: mi-empresa-whatsapp"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre único para identificar esta instancia
                </p>
              </div>

              <div>
                <Label htmlFor="webhookUrl">URL del Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="http://localhost:8081/instance/connect/mi-instancia"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL de la API de Evolution donde está corriendo la instancia
                </p>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="evolution_api_key_2024"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Clave de API para autenticación con Evolution API
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horarios de Atención
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="businessHours"
                  checked={formData.businessHours.enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      businessHours: { ...formData.businessHours, enabled: checked }
                    })
                  }
                />
                <Label htmlFor="businessHours">Activar horarios de atención</Label>
              </div>

              {formData.businessHours.enabled && (
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={formData.businessHours.timezone}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        businessHours: { ...formData.businessHours, timezone: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anti-Spam */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Protección Anti-Spam
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="antiSpam"
                  checked={formData.antiSpam.enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      antiSpam: { ...formData.antiSpam, enabled: checked }
                    })
                  }
                />
                <Label htmlFor="antiSpam">Activar protección anti-spam</Label>
              </div>

              {formData.antiSpam.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cooldownMinutes">Enfriamiento (minutos)</Label>
                    <Input
                      id="cooldownMinutes"
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.antiSpam.cooldownMinutes}
                      onChange={(e) => 
                        setFormData({ 
                          ...formData, 
                          antiSpam: { 
                            ...formData.antiSpam, 
                            cooldownMinutes: parseInt(e.target.value) || 60
                          }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxMessages">Máx. mensajes/hora</Label>
                    <Input
                      id="maxMessages"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.antiSpam.maxMessagesPerHour}
                      onChange={(e) => 
                        setFormData({ 
                          ...formData, 
                          antiSpam: { 
                            ...formData.antiSpam, 
                            maxMessagesPerHour: parseInt(e.target.value) || 5
                          }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {formData.antiSpam.enabled && (
                <Alert>
                  <AlertDescription>
                    Después de enviar un mensaje, habrá un período de enfriamiento de {formData.antiSpam.cooldownMinutes} minutos
                    antes de poder enviar otro mensaje al mismo contacto. Máximo {formData.antiSpam.maxMessagesPerHour} mensajes por hora.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Instancia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}