import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface NodeHelpModalProps {
  nodeType: string;
  title: string;
  description: string;
  usage: readonly string[];
  examples: readonly string[];
  tips?: readonly string[];
}

export function NodeHelpModal({
  nodeType,
  title,
  description,
  usage,
  examples,
  tips = []
}: NodeHelpModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-blue-400"
        >
          <HelpCircle className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-100 flex items-center gap-2">
            <span className="text-2xl">{getNodeIcon(nodeType)}</span>
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ¿Cómo funciona? */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-400">🔧 ¿Cómo funciona?</h3>
            <ul className="space-y-2">
              {usage.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ejemplos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-green-400">📋 Ejemplos de uso</h3>
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                  <code className="text-green-300 text-sm whitespace-pre-wrap">{example}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-yellow-400">💡 Consejos</h3>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-yellow-400 mt-1">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variables disponibles */}
          <div className="bg-orange-950/30 border border-orange-800/50 rounded-lg p-4">
            <h4 className="text-orange-400 font-semibold mb-2">🔗 Variables disponibles</h4>
            <div className="space-y-1 text-sm font-mono">
              <div className="text-orange-300">{'{{trigger.input.leadName}}'} - Nombre del lead</div>
              <div className="text-orange-300">{'{{trigger.input.leadEmail}}'} - Email del lead</div>
              <div className="text-orange-300">{'{{trigger.input.leadIndustry}}'} - Industria del lead</div>
              <div className="text-orange-300">{'{{step_nodo-anterior.campo}}'} - Resultado de nodo anterior</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNodeIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    trigger: '⚡',
    apiCall: '🔗',
    pandadocNode: '📄',
    dataTransform: '🔄',
    monitor: '🔍',
  };
  return icons[nodeType] || '❓';
}