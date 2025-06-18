import React from 'react';
import { Handle, Position } from 'reactflow';
import { RefreshCw } from 'lucide-react';
import { NodeHelpModal } from '../components/NodeHelpModal';

interface DataTransformNodeProps {
  data: any;
}

export function DataTransformNode({ data }: DataTransformNodeProps) {
  const helpContent = {
    nodeType: 'dataTransform',
    title: 'Nodo Transformador de Datos',
    description: 'Transforma y reestructura datos JSON de nodos anteriores. Ideal para formatear información antes del siguiente paso.',
    usage: [
      'Recibe datos de nodos anteriores',
      'Aplica transformaciones JSON definidas',
      'Mapea campos a nuevos nombres',
      'Extrae valores específicos de objetos complejos',
      'Prepara datos para el siguiente nodo'
    ],
    examples: [
      `// Transformación básica:
Origen: step_api-call-1
Destino: datosLimpios
Mapeo: {
  "nombre": "name",
  "telefono": "phone", 
  "ubicacion": "address.city"
}`,
      `// Resultado de la transformación:
{
  "datosLimpios": {
    "nombre": "Juan Pérez",
    "telefono": "+1234567890",
    "ubicacion": "Madrid"
  }
}`
    ],
    tips: [
      'Usa notación de puntos para datos anidados',
      'Puedes crear múltiples transformaciones',
      'Ideal para limpiar respuestas de APIs',
      'Combina datos de diferentes fuentes'
    ]
  };

  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-purple-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...helpContent} />
      
      <div className="flex items-center">
        <RefreshCw className="h-4 w-4 mr-2 text-purple-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || 'Transformar'}
        </div>
      </div>
    </div>
  );
}