"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { WhatsAppInstance } from '@/types';
import { WhatsAppInstanceCard } from './WhatsAppInstanceCard';
import { CreateInstanceModal } from './CreateInstanceModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';

export function WhatsAppConfig() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  const loadInstances = async () => {
    if (!user || !organizationId) return;

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/whatsapp/instances?organizationId=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setInstances(result.data);
      } else {
        throw new Error(result.message || 'Error al cargar instancias');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar instancias',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceCreated = (newInstance: WhatsAppInstance) => {
    setInstances(prev => [newInstance, ...prev]);
  };

  const handleInstanceUpdated = (updatedInstance: WhatsAppInstance) => {
    setInstances(prev => 
      prev.map(instance => 
        instance.id === updatedInstance.id ? updatedInstance : instance
      )
    );
  };

  const handleInstanceDeleted = async (instanceId: string) => {
    if (!user || !organizationId) return;

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/whatsapp/instances?organizationId=${organizationId}&instanceId=${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setInstances(prev => prev.filter(instance => instance.id !== instanceId));
        toast({
          title: "Éxito",
          description: "Instancia eliminada exitosamente",
        });
      } else {
        throw new Error(result.message || 'Error al eliminar instancia');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al eliminar instancia',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadInstances();
  }, [user, organizationId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando configuración de WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Configuración de WhatsApp
            </CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Instancia
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {instances.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tienes instancias de WhatsApp configuradas. Crea una nueva instancia para comenzar a enviar mensajes.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gestiona tus instancias de WhatsApp conectadas. Cada instancia permite conectar un número de WhatsApp diferente.
              </p>
              
              <div className="grid gap-4">
                {instances.map((instance) => (
                  <WhatsAppInstanceCard
                    key={instance.id}
                    instance={instance}
                    onUpdate={handleInstanceUpdated}
                    onDelete={handleInstanceDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInstanceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onInstanceCreated={handleInstanceCreated}
      />
    </div>
  );
}