import React from 'react';
import { Handle, Position } from 'reactflow';
import { Link } from 'lucide-react';
import { NodeHelpModal } from '../components/NodeHelpModal';

interface ApiCallNodeProps {
  data: any;
}

export function ApiCallNode({ data }: ApiCallNodeProps) {
  const helpContent = {
    nodeType: 'apiCall',
    title: 'Nodo API Genérico',
    description: 'Realiza llamadas HTTP a cualquier API externa o interna. Ideal para integraciones con servicios web.',
    usage: [
      'Se conecta a APIs REST usando HTTP',
      'Soporta GET, POST, PUT, DELETE',
      'Permite configurar headers y autenticación',
      'Procesa respuestas JSON automáticamente',
      'Pasa datos al siguiente nodo en el flujo'
    ],
    examples: [
      `// Ejemplo: Consultar datos de un usuario
URL: https://jsonplaceholder.typicode.com/users/{{trigger.input.userId}}
Método: GET
Headers: {
  "Content-Type": "application/json"
}`,
      `// Ejemplo: Crear un nuevo registro
URL: https://api.miservicio.com/clientes
Método: POST
Body: {
  "nombre": "{{trigger.input.leadName}}",
  "email": "{{trigger.input.leadEmail}}"
}`
    ],
    tips: [
      'Usa variables dinámicas para URLs personalizadas',
      'Configura headers de autenticación según tu API',
      'Verifica el formato de respuesta esperado',
      'Usa el nodo Monitor después para debug'
    ]
  };

  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-blue-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...helpContent} />
      
      <div className="flex items-center">
        <Link className="h-4 w-4 mr-2 text-blue-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || 'Llamada API'}
        </div>
      </div>
      {data.config?.method && (
        <div className="text-xs mt-1 uppercase font-mono" style={{ color: '#d1d5db' }}>
          {data.config.method}
        </div>
      )}
    </div>
  );
}