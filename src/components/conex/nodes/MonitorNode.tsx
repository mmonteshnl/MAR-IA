import React from 'react';
import { Handle, Position } from 'reactflow';
import { Monitor } from 'lucide-react';
import { NodeHelpModal } from '../components/NodeHelpModal';

interface MonitorNodeProps {
  data: any;
}

export function MonitorNode({ data }: MonitorNodeProps) {
  const helpContent = {
    nodeType: 'monitor',
    title: 'Nodo Monitor - Tu "Monito" de Debug',
    description: 'Captura y muestra datos del flujo en la consola del navegador. Perfecto para debugging y verificar que todo funcione correctamente.',
    usage: [
      'Intercepta datos sin afectar el flujo',
      'Muestra información en la consola del navegador',
      'Permite filtrar campos específicos',
      'Soporta diferentes formatos de salida',
      'Incluye timestamps para seguimiento'
    ],
    examples: [
      `// Configuración básica:
Nombre: "Debug Lead Data"
Campos: "leadName,leadEmail,leadValue"
Formato: JSON
Timestamp: ✓ Activado`,
      `// Lo que verás en la consola:
🔍 MONITOR: Debug Lead Data
⏰ Timestamp: 2025-01-18T18:23:45.123Z
📦 Datos capturados:
{
  "leadName": "TechStart Solutions",
  "leadEmail": "contacto@techstart.com",
  "leadValue": 15000
}`
    ],
    tips: [
      'Abre la consola del navegador (F12) para ver los datos',
      'Deja "Campos" vacío para ver toda la información',
      'Úsalo después de APIs para verificar respuestas',
      'Ideal para encontrar errores en el flujo'
    ]
  };

  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-cyan-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...helpContent} />
      
      <div className="flex items-center">
        <Monitor className="h-4 w-4 mr-2 text-cyan-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || 'Monitor'}
        </div>
      </div>
      {data.config?.displayFields && (
        <div className="text-xs mt-1 font-mono" style={{ color: '#67e8f9' }}>
          Mostrando: {data.config.displayFields.split(',').length} campos
        </div>
      )}
    </div>
  );
}