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
import { CopyApiLinkModal } from '@/components/conex/CopyApiLinkModal';
import { FlowTemplatesLibrary } from '@/components/conex/FlowTemplatesLibrary';
import { Plus, Edit, Trash2, Play, Pause, Workflow, Clock, Zap, Webhook, TestTube, FileText, Mail, Database, Link, Star, Sparkles } from 'lucide-react';
import { Flow, CreateFlowRequest } from '@/types/conex';
import type { FlowTemplate } from '@/config/flow-templates';

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
  const [copyLinkFlow, setCopyLinkFlow] = useState<Flow | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

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
  }, [user?.uid, organization?.id]);

  // Función para generar alias automáticamente
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

  const fetchFlows = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const token = await user.getIdToken();
      if (!organization) {
        throw new Error('Organization not found');
      }
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

  const handleTemplateSelect = (template: FlowTemplate) => {
    console.log('🔍 DEPURACIÓN: Plantilla seleccionada:', template);
    console.log('🔍 DEPURACIÓN: Template flowData:', template.flowData);
    console.log('🔍 DEPURACIÓN: Template nodes count:', template.flowData?.nodes?.length);
    console.log('🔍 DEPURACIÓN: Template edges count:', template.flowData?.edges?.length);
    
    // Pre-fill form with template data
    setFormData({
      name: template.name,
      description: template.description,
      isActive: true,
      trigger: {
        type: 'manual_lead_action', // Use proper trigger type for templates
        config: {}
      },
      icon: template.id === 'whatsapp-welcome-meta' ? 'Mail' : 
            template.id === 'slack-high-value-notification' ? 'Bell' :
            template.id === 'ai-call-high-priority' ? 'Phone' : 'Workflow',
      isEnabled: true
    });
    
    // Create the flow with template data
    const autoAlias = generateAlias(template.name);
    const flowDataWithAlias = {
      ...formData,
      name: template.name,
      description: template.description,
      alias: autoAlias
    };
    
    console.log('🔍 DEPURACIÓN: Datos para la API:', flowDataWithAlias);
    createFlowWithTemplate(flowDataWithAlias, template);
  };

  const createFlowWithTemplate = async (flowData: CreateFlowRequest, template: FlowTemplate) => {
    console.log('🔍 DEPURACIÓN: Iniciando createFlowWithTemplate');
    console.log('🔍 DEPURACIÓN: Organization:', organization);
    console.log('🔍 DEPURACIÓN: User:', user);
    
    if (!organization || !user) {
      console.error('🔍 DEPURACIÓN: Missing organization or user');
      toast({
        title: 'Error',
        description: 'Organization or user not found',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    try {
      console.log('🔍 DEPURACIÓN: Getting user token...');
      const token = await user.getIdToken();
      console.log('🔍 DEPURACIÓN: Token obtained successfully');
      
      const requestBody = {
        ...flowData,
        organizationId: organization.id,
        definition: template.flowData, // Use template's flow data as definition
        variables: template.variables || {},
        requiredConnections: template.requiredConnections || []
      };
      
      console.log('🔍 DEPURACIÓN: Request body enviado a API:', requestBody);
      console.log('🔍 DEPURACIÓN: Template definition en request:', requestBody.definition);
      console.log('🔍 DEPURACIÓN: Required fields check:', {
        name: !!requestBody.name,
        description: !!requestBody.description,
        icon: !!requestBody.icon,
        trigger: !!requestBody.trigger,
        definition: !!requestBody.definition,
        organizationId: !!requestBody.organizationId
      });
      
      console.log('🔍 DEPURACIÓN: Making fetch request to /api/flows...');
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 DEPURACIÓN: Response received, status:', response.status);
      console.log('🔍 DEPURACIÓN: Response ok:', response.ok);

      if (!response.ok) {
        console.log('🔍 DEPURACIÓN: Response not ok, getting error details...');
        let errorText;
        let errorData;
        
        try {
          errorText = await response.text();
          console.log('🔍 DEPURACIÓN: Raw error text:', errorText);
        } catch (textError) {
          console.error('🔍 DEPURACIÓN: Error reading response text:', textError);
          errorText = 'Could not read response';
        }
        
        try {
          errorData = JSON.parse(errorText);
          console.log('🔍 DEPURACIÓN: Parsed error data:', errorData);
        } catch (parseError) {
          console.error('🔍 DEPURACIÓN: Error parsing JSON:', parseError);
          errorData = { error: 'Could not parse error response', raw: errorText, status: response.status };
        }
        
        console.error('🔍 DEPURACIÓN: Error de API:', errorData, 'al intentar escoger una de: Biblioteca de Plantillas CONEX');
        console.error('🔍 DEPURACIÓN: Response status:', response.status);
        console.error('🔍 DEPURACIÓN: Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Failed to create flow from template: ${errorData.error || 'Unknown error'}`);
      }

      const newFlow = await response.json();
      console.log('🔍 DEPURACIÓN: Nuevo flujo recibido de la API:', newFlow);
      console.log('🔍 DEPURACIÓN: Definición del flujo:', newFlow.definition);
      
      setFlows([...flows, newFlow]);
      
      toast({
        title: 'Flujo creado desde plantilla',
        description: `"${template.name}" se ha creado exitosamente. Puedes editarlo ahora.`
      });
      
      // Open the flow in the builder for customization
      console.log('🔍 DEPURACIÓN: Pasando al FlowBuilder:', newFlow);
      setEditingFlow(newFlow);
      setShowBuilder(true);
      
    } catch (error) {
      console.error('🔍 DEPURACIÓN: Catch block - Error creating flow from template:', error);
      console.error('🔍 DEPURACIÓN: Error type:', typeof error);
      console.error('🔍 DEPURACIÓN: Error message:', error instanceof Error ? error.message : String(error));
      console.error('🔍 DEPURACIÓN: Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      toast({
        title: 'Error',
        description: `Failed to create flow from template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const token = await user.getIdToken();
      
      // Generar alias automáticamente basado en el nombre
      const autoAlias = generateAlias(formData.name);
      const flowDataWithAlias = {
        ...formData,
        alias: autoAlias
      };
      
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(flowDataWithAlias)
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
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }
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
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }
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
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }
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
    // Ensure initialFlowData has nodes and edges arrays
    const safeInitialFlowData: { nodes: any[]; edges: any[] } =
      (editingFlow?.definition &&
        Array.isArray(editingFlow.definition.nodes) &&
        Array.isArray(editingFlow.definition.edges))
        ? { nodes: editingFlow.definition.nodes, edges: editingFlow.definition.edges }
        : { nodes: [], edges: [] };
    return (
      <div className="h-screen">
        <div className="flex items-center justify-between px-4 border-b">
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
            initialFlowData={safeInitialFlowData}
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
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Star className="mr-2 h-4 w-4" />
            Plantillas
          </Button>
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
                {formData.name && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Alias automático:</span>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {generateAlias(formData.name)}
                    </Badge>
                  </div>
                )}
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
              <Button size="lg" onClick={() => setShowTemplates(true)} variant="outline" className="w-full">
                <Sparkles className="h-5 w-5 mr-2" />
                Usar Plantilla
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Crear desde Cero
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
                      {flow.alias && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {flow.alias}
                          </Badge>
                        </div>
                      )}
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
                      onClick={() => setCopyLinkFlow(flow)}
                      title="Copiar API Links"
                    >
                      <Link className="h-4 w-4 text-blue-400" />
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

      {/* Modal para copiar API Links */}
      {copyLinkFlow && (
        <CopyApiLinkModal
          isOpen={!!copyLinkFlow}
          onClose={() => setCopyLinkFlow(null)}
          flowId={copyLinkFlow.id}
          flowName={copyLinkFlow.name}
          flowAlias={copyLinkFlow.alias}
        />
      )}
      
      {/* Flow Templates Library */}
      <FlowTemplatesLibrary
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}