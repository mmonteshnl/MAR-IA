'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { FlowBuilder } from '@/components/conex/FlowBuilder';
import { Plus, Edit, Trash2, Play, Pause, Workflow, Clock, Zap, Webhook, TestTube, FileText, Mail, Database } from 'lucide-react';
import { Flow, CreateFlowRequest } from '@/types/conex';

// Configuración de iconos disponibles
const AVAILABLE_ICONS = [
  { value: 'Workflow', label: 'Flujo de Trabajo', icon: Workflow },
  { value: 'FileText', label: 'Documento', icon: FileText },
  { value: 'Mail', label: 'Email', icon: Mail },
  { value: 'Database', label: 'Base de Datos', icon: Database },
  { value: 'Zap', label: 'Automatización', icon: Zap },
];

// Función para obtener el icono por su valor
const getIconComponent = (iconValue: string) => {
  const iconConfig = AVAILABLE_ICONS.find(icon => icon.value === iconValue);
  return iconConfig?.icon || Workflow;
};

export default function FlowsPage() {
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [testingFlow, setTestingFlow] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateFlowRequest>({
    name: '',
    description: '',
    icon: 'Workflow',
    trigger: {
      type: 'manual_lead_action',
      config: {}
    },
    definition: { nodes: [], edges: [] },
    isEnabled: true
  });

  useEffect(() => {
    if (user && organization) {
      fetchFlows();
    }
  }, [user, organization]);



  const fetchFlows = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/flows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.flows);
    } catch (error) {
      console.error('Error fetching flows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flows',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create flow');
      }

      const newFlow = await response.json();
      setFlows(prev => [newFlow, ...prev]);
      setDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Flow created successfully'
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create flow',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFlow = async (flowId: string, updates: Partial<Flow>) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update flow');
      }

      const updatedFlow = await response.json();
      setFlows(prev => prev.map(flow => flow.id === flowId ? updatedFlow : flow));
      
      toast({
        title: 'Success',
        description: 'Flow updated successfully'
      });
    } catch (error) {
      console.error('Error updating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flow',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete flow');
      }

      setFlows(prev => prev.filter(flow => flow.id !== flowId));
      
      toast({
        title: 'Success',
        description: 'Flow deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flow',
        variant: 'destructive'
      });
    }
  };

  const handleSaveFlowDefinition = async (flowData: { nodes: any[]; edges: any[] }) => {
    if (!editingFlow) return;

    setSaving(true);
    try {
      await handleUpdateFlow(editingFlow.id, { definition: flowData });
      setShowBuilder(false);
      setEditingFlow(null);
    } catch (error) {
      // Error already handled in handleUpdateFlow
    } finally {
      setSaving(false);
    }
  };

  const testFlow = async (flowId: string) => {
    setTestingFlow(flowId);
    try {
      const token = await user.getIdToken();
      
      // Datos de prueba para el demo - usar diferentes casos de negocio
      const testBusinesses = [
        { name: 'TechStart Solutions', industry: 'Technology', value: 15000 },
        { name: 'Marketing Pro Agency', industry: 'Marketing', value: 25000 },
        { name: 'Green Energy Corp', industry: 'Energy', value: 50000 },
        { name: 'Health Plus Clinic', industry: 'Healthcare', value: 30000 },
        { name: 'Finance Solutions Ltd', industry: 'Finance', value: 40000 }
      ];
      const randomBusiness = testBusinesses[Math.floor(Math.random() * testBusinesses.length)];
      
      const testPayload = {
        leadName: randomBusiness.name,
        leadEmail: `contacto@${randomBusiness.name.toLowerCase().replace(/\s+/g, '')}.com`,
        leadPhone: '+1234567890',
        leadStage: 'Interested',
        leadSource: 'API Demo',
        leadIndustry: randomBusiness.industry,
        leadValue: randomBusiness.value,
        organizationId: organization.id
      };

      const response = await fetch(`/api/flows/run/${flowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify({ inputPayload: testPayload })
      });

      if (!response.ok) {
        throw new Error('Failed to test flow');
      }

      const result = await response.json();
      
      toast({
        title: `📄 Cotización para ${randomBusiness.name} Generada`,
        description: `Flujo ejecutado exitosamente. Revisa la consola para ver los detalles.`,
      });
      
      // Mostrar resultado detallado en consola
      console.log('🎯 RESULTADO DEL FLUJO PANDADOC:', {
        business: randomBusiness.name,
        industry: randomBusiness.industry,
        value: randomBusiness.value,
        executionId: result.executionId,
        status: result.status,
        fullResults: result
      });
      
      // Si hay resultados de transformación, mostrarlos de forma organizada
      if (result.results && Object.keys(result.results).length > 0) {
        console.log('📊 DATOS TRANSFORMADOS:');
        Object.entries(result.results).forEach(([stepId, stepResult]: [string, any]) => {
          console.log(`\n🔸 ${stepId}:`, stepResult);
          
          // Si este paso tiene datos de cotización, mostrarlo destacado
          if (stepResult?.quoteResult) {
            console.log('📄 COTIZACIÓN CREADA:', {
              documentId: stepResult.quoteResult.documentId,
              documentName: stepResult.quoteResult.documentName,
              status: stepResult.quoteResult.status,
              shareLink: stepResult.quoteResult.shareLink,
              clientName: stepResult.quoteResult.clientName,
              clientEmail: stepResult.quoteResult.clientEmail
            });
          }
          
          // Si este paso tiene datos de generación de IA, mostrarlo
          if (stepResult?.resumen_financiero) {
            console.log('💰 RESUMEN FINANCIERO:', {
              precioRecomendado: stepResult.resumen_financiero.precio_recomendado,
              titulo: stepResult.titulo,
              paqueteSugerido: stepResult.paquetes_sugeridos?.[0]?.nombre
            });
          }
          
          // Si este paso es un monitor, mostrar los datos capturados
          if (stepResult?.consoleLog) {
            console.group(stepResult.consoleLog.title);
            
            if (stepResult.consoleLog.timestamp) {
              console.log('⏰ Timestamp:', stepResult.consoleLog.timestamp);
            }
            
            switch (stepResult.consoleLog.format) {
              case 'table':
                console.log('📋 Datos en formato tabla:');
                console.log(stepResult.formattedOutput);
                break;
              case 'list':
                console.log('📝 Datos en formato lista:');
                console.log(stepResult.formattedOutput);
                break;
              case 'json':
              default:
                console.log('📦 Datos capturados:');
                console.log(stepResult.consoleLog.data);
                break;
            }
            
            console.groupEnd();
          }
        });
      }
      
    } catch (error) {
      console.error('Error testing flow:', error);
      toast({
        title: 'Error en prueba',
        description: error instanceof Error ? error.message : 'Error al probar el flujo',
        variant: 'destructive'
      });
    } finally {
      setTestingFlow(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Workflow',
      trigger: {
        type: 'manual_lead_action',
        config: {}
      },
      definition: { nodes: [], edges: [] },
      isEnabled: true
    });
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'manual_lead_action':
        return <Zap className="h-4 w-4" />;
      case 'schedule':
        return <Clock className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return <Workflow className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels = {
      manual_lead_action: 'Manual',
      schedule: 'Scheduled',
      webhook: 'Webhook',
      event: 'Event'
    };
    return labels[triggerType as keyof typeof labels] || triggerType;
  };

  if (showBuilder) {
    return (
      <div className="h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">Flow Builder</h1>
            <p className="text-muted-foreground">
              {editingFlow ? `Editing: ${editingFlow.name}` : 'Create new flow'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            Back to Flows
          </Button>
        </div>
        <div className="h-[calc(100vh-80px)]">
          <FlowBuilder
            onSave={handleSaveFlowDefinition}
            initialFlowData={editingFlow?.definition}
            loading={saving}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading flows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flujos Visuales</h1>
          <p className="text-muted-foreground mt-2">
            Diseña workflows arrastrando y conectando nodos visuales. Todo integrado en una sola vista.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Flow</DialogTitle>
              <DialogDescription>
                Create a new automated workflow
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Flow Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Generate PandaDoc Quote"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this flow does..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icono</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue>
                      {formData.icon && (
                        <div className="flex items-center gap-2">
                          {React.createElement(getIconComponent(formData.icon), { className: "h-4 w-4" })}
                          <span>{AVAILABLE_ICONS.find(icon => icon.value === formData.icon)?.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((iconConfig) => (
                      <SelectItem key={iconConfig.value} value={iconConfig.value}>
                        <div className="flex items-center gap-2">
                          {React.createElement(iconConfig.icon, { className: "h-4 w-4" })}
                          <span>{iconConfig.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select 
                  value={formData.trigger.type} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    trigger: { ...prev.trigger, type: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_lead_action">Manual (Lead Action)</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                />
                <Label htmlFor="isEnabled">Enable flow</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlow} disabled={saving}>
                {saving ? 'Creating...' : 'Create Flow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full p-6 mb-6">
              <Workflow className="h-16 w-16 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-center">Crea tu Primer Flujo Visual</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
              Arrastra nodos al canvas, configúralos y conéctalos. Todo en una sola vista visual sin código.
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primer Flujo
                  </Button>
                </DialogTrigger>
              </Dialog>
              
            
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getIconComponent(flow.icon), { className: "h-5 w-5" })}
                    <div>
                      <CardTitle className="text-lg">{flow.name}</CardTitle>
                      <CardDescription>{flow.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testFlow(flow.id)}
                      disabled={testingFlow === flow.id}
                      title="Probar flujo"
                    >
                      {testingFlow === flow.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                      ) : (
                        <TestTube className="h-4 w-4 text-green-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFlow(flow);
                        setShowBuilder(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{flow.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteFlow(flow.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTriggerIcon(flow.trigger.type)}
                      <Badge variant="outline">
                        {getTriggerLabel(flow.trigger.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={flow.isEnabled}
                        onCheckedChange={(checked) => handleUpdateFlow(flow.id, { isEnabled: checked })}
                        size="sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        {flow.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated {new Date(flow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}