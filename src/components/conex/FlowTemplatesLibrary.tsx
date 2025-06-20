"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Bell, 
  Shield, 
  Plug, 
  Clock, 
  Users, 
  Zap,
  Phone,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  ArrowRight,
  Copy,
  ExternalLink,
  Star
} from 'lucide-react';

import { FLOW_TEMPLATES, getTemplatesByCategory, type FlowTemplate } from '@/config/flow-templates';
import { useToast } from '@/hooks/use-toast';

interface FlowTemplatesLibraryProps {
  onTemplateSelect: (template: FlowTemplate) => void;
  onClose: () => void;
  isOpen: boolean;
}

const categoryConfig = {
  comunicacion: {
    icon: MessageSquare,
    title: 'Comunicación',
    description: 'Plantillas para interacción directa con leads y clientes',
    color: 'bg-blue-500/10 text-blue-700 border-blue-200'
  },
  notificaciones: {
    icon: Bell,
    title: 'Notificaciones',
    description: 'Alertas y notificaciones para el equipo interno',
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
  },
  validacion: {
    icon: Shield,
    title: 'Validación',
    description: 'Verificación y calificación automática de leads',
    color: 'bg-green-500/10 text-green-700 border-green-200'
  },
  integracion: {
    icon: Plug,
    title: 'Integración',
    description: 'Conexiones con herramientas externas y APIs',
    color: 'bg-purple-500/10 text-purple-700 border-purple-200'
  }
};

const difficultyConfig = {
  facil: {
    icon: CheckCircle,
    label: 'Fácil',
    description: 'Configuración en minutos',
    color: 'bg-green-100 text-green-800'
  },
  intermedio: {
    icon: AlertCircle,
    label: 'Intermedio',
    description: 'Requiere configuración adicional',
    color: 'bg-yellow-100 text-yellow-800'
  },
  avanzado: {
    icon: Info,
    label: 'Avanzado',
    description: 'Para usuarios experimentados',
    color: 'bg-red-100 text-red-800'
  }
};

const FlowTemplateCard: React.FC<{
  template: FlowTemplate;
  onSelect: (template: FlowTemplate) => void;
  onPreview: (template: FlowTemplate) => void;
}> = ({ template, onSelect, onPreview }) => {
  const categoryData = categoryConfig[template.category];
  const difficultyData = difficultyConfig[template.difficulty];
  const CategoryIcon = categoryData.icon;
  const DifficultyIcon = difficultyData.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-border hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${categoryData.color}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={difficultyData.color}>
                  <DifficultyIcon className="h-3 w-3 mr-1" />
                  {difficultyData.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {template.estimatedTime}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(template)}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-4 line-clamp-2">
          {template.description}
        </CardDescription>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Caso de uso:</p>
            <p className="text-xs text-foreground line-clamp-2">{template.useCase}</p>
          </div>
          
          {template.requiredConnections && template.requiredConnections.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Conexiones requeridas:</p>
              <div className="flex flex-wrap gap-1">
                {template.requiredConnections.map((connection) => (
                  <Badge key={connection} variant="secondary" className="text-xs">
                    {connection}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {template.flowData.nodes.length} nodos
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {template.flowData.edges.length} conexiones
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onSelect(template)}
            className="flex-1 h-9"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Usar esta plantilla
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="h-9 px-3"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FlowTemplatePreview: React.FC<{
  template: FlowTemplate;
  onSelect: (template: FlowTemplate) => void;
}> = ({ template, onSelect }) => {
  const categoryData = categoryConfig[template.category];
  const difficultyData = difficultyConfig[template.difficulty];
  const CategoryIcon = categoryData.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${categoryData.color}`}>
          <CategoryIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{template.name}</h3>
          <p className="text-muted-foreground mt-1">{template.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge className={difficultyData.color}>
              {difficultyData.label}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {template.estimatedTime}
            </span>
            <span className="text-sm text-muted-foreground">
              {categoryData.title}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Caso de uso</h4>
            <p className="text-sm text-muted-foreground">{template.useCase}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Estructura del flujo</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{template.flowData.nodes.length} nodos de procesamiento</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>{template.flowData.edges.length} conexiones entre nodos</span>
              </div>
            </div>
          </div>

          {template.requiredConnections && template.requiredConnections.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Conexiones requeridas</h4>
              <div className="flex flex-wrap gap-2">
                {template.requiredConnections.map((connection) => (
                  <Badge key={connection} variant="outline">
                    <Plug className="h-3 w-3 mr-1" />
                    {connection}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Asegúrate de configurar estas conexiones antes de usar la plantilla.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Nodos incluidos</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {template.flowData.nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{node.data.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {node.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {template.variables && Object.keys(template.variables).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Variables configurables</h4>
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {Object.entries(template.variables).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-mono text-xs bg-muted px-1 rounded">{key}</span>
                      <span className="text-muted-foreground ml-2">
                        {typeof value === 'string' ? value.slice(0, 50) + (value.length > 50 ? '...' : '') : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          <p>Esta plantilla te ayudará a configurar un flujo automatizado en {template.estimatedTime}.</p>
        </div>
        <Button onClick={() => onSelect(template)} className="ml-4">
          <Sparkles className="h-4 w-4 mr-2" />
          Usar esta plantilla
        </Button>
      </div>
    </div>
  );
};

export const FlowTemplatesLibrary: React.FC<FlowTemplatesLibraryProps> = ({
  onTemplateSelect,
  onClose,
  isOpen
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | FlowTemplate['category']>('all');
  const [previewTemplate, setPreviewTemplate] = useState<FlowTemplate | null>(null);
  const { toast } = useToast();

  const filteredTemplates = selectedCategory === 'all' 
    ? FLOW_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateSelect = (template: FlowTemplate) => {
    toast({
      title: "Plantilla cargada",
      description: `"${template.name}" se ha cargado en el editor de flujos.`
    });
    onTemplateSelect(template);
    onClose();
  };

  const categories = Object.entries(categoryConfig);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Biblioteca de Plantillas CONEX
          </DialogTitle>
          <DialogDescription>
            Acelera tu automatización con plantillas prediseñadas para casos de uso comunes.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              {categories.map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="all" className="mt-0">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  {FLOW_TEMPLATES.map((template) => (
                    <FlowTemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                      onPreview={setPreviewTemplate}
                    />
                  ))}
                </div>
              </TabsContent>

              {categories.map(([key, config]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <config.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{config.title}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                    {getTemplatesByCategory(key as FlowTemplate['category']).map((template) => (
                      <FlowTemplateCard
                        key={template.id}
                        template={template}
                        onSelect={handleTemplateSelect}
                        onPreview={setPreviewTemplate}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista previa de plantilla</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {previewTemplate && (
              <FlowTemplatePreview
                template={previewTemplate}
                onSelect={handleTemplateSelect}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};