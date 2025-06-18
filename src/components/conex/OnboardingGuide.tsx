'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Workflow, 
  Play, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  X 
} from 'lucide-react';

interface OnboardingGuideProps {
  onClose?: () => void;
  className?: string;
}

export function OnboardingGuide({ onClose, className }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "¡Bienvenido a Conex!",
      description: "Tu plataforma de automatización visual",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Conex transforma tu CRM en una plataforma de automatización potente. 
            Crea workflows visuales que se conecten a APIs externas sin escribir código.
          </p>
          <div className="bg-gradient-to-r from-blue-950/40 to-purple-950/40 p-4 rounded-lg border border-blue-800/30">
            <h4 className="font-medium text-sm mb-2 text-blue-200">¿Qué puedes hacer?</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Automatizar generación de cotizaciones en PandaDoc</li>
              <li>• Conectar cualquier API REST de forma segura</li>
              <li>• Crear workflows que se ejecuten desde leads</li>
              <li>• Eliminar scripts hardcodeados y riesgosos</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Sección 1: Conexiones API",
      description: "Conecta servicios externos de forma segura",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Las conexiones almacenan credenciales de APIs de forma encriptada. 
            Cada organización tiene sus propias conexiones aisladas.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="border border-blue-800/30 rounded-lg p-3 bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm font-medium text-blue-200">PandaDoc API</span>
                <Badge variant="outline" className="text-xs border-amber-600 text-amber-300">Recomendado</Badge>
              </div>
              <p className="text-xs text-blue-300">
                Migra tu script de Python automáticamente
              </p>
            </div>
            <div className="border border-green-800/30 rounded-lg p-3 bg-green-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-green-200">API REST Genérica</span>
              </div>
              <p className="text-xs text-green-300">
                Conecta cualquier servicio web
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Sección 2: Flujos Automatizados",
      description: "Constructor visual de workflows",
      icon: Workflow,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Usa el constructor visual para crear flujos arrastrando y conectando nodos. 
            Cada flujo puede tener triggers, llamadas API y transformaciones.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-green-800/30 rounded-lg bg-green-950/20">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-200">Trigger Manual</p>
                <p className="text-xs text-green-300">Se ejecuta desde acciones de lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-blue-800/30 rounded-lg bg-blue-950/20">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Database className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-200">Llamada API</p>
                <p className="text-xs text-blue-300">Conecta con servicios externos</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "¡Todo Listo!",
      description: "Automatización integrada en tu CRM",
      icon: Play,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Los flujos con trigger "Manual" aparecen automáticamente en las acciones de IA de cada lead. 
            Sin configuración adicional, sin código.
          </p>
          <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-4 rounded-lg border border-purple-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-200">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Integración Automática
            </h4>
            <p className="text-sm text-purple-300 leading-relaxed">
              Cuando crees un flujo con trigger "Manual (Lead Action)", aparecerá instantáneamente 
              en el modal de "Acciones IA" de todos los leads.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentStepData.content}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Anterior
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  if (onClose) onClose();
                  window.location.href = '/conex/connections';
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                ¡Empezar!
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}