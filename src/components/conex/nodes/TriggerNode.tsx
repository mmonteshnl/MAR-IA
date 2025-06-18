import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import { NodeHelpModal } from '../components/NodeHelpModal';

interface TriggerNodeProps {
  data: any;
}

export function TriggerNode({ data }: TriggerNodeProps) {
  const helpContent = {
    nodeType: 'trigger',
    title: 'Nodo Disparador Manual',
    description: 'Punto de inicio del flujo de automatización. Recibe los datos iniciales cuando se ejecuta el flujo.',
    usage: [
      'Es el primer nodo de todo flujo',
      'Recibe datos cuando ejecutas el flujo desde un lead',
      'Proporciona variables del lead como nombre, email, etc.',
      'Se activa manualmente desde las acciones de IA',
      'No necesita configuración especial'
    ],
    examples: [
      `// Datos que recibe automáticamente:
{
  "leadName": "TechStart Solutions",
  "leadEmail": "contacto@techstart.com", 
  "leadIndustry": "Tecnología",
  "leadValue": 15000,
  "leadStage": "Interesado"
}`,
      `// Cómo usar las variables en otros nodos:
{{trigger.input.leadName}} → "TechStart Solutions"
{{trigger.input.leadEmail}} → "contacto@techstart.com"
{{trigger.input.leadValue}} → 15000`
    ],
    tips: [
      'Siempre debe ser el primer nodo de tu flujo',
      'Los datos vienen automáticamente del lead seleccionado',
      'Usa las variables en nodos posteriores',
      'No necesitas configurar nada, solo conectar'
    ]
  };

  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-green-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...helpContent} />
      
      <div className="flex items-center">
        <Zap className="h-4 w-4 mr-2 text-green-400" />
        <div className="text-sm font-semibold" style={{ color: 'white !important' }}>
          {data.config?.name || 'Disparador'}
        </div>
      </div>
    </div>
  );
}