import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import { TriggerNodeConfig, TriggerNodeData } from './schema';
import { HELP_CONTENT, TRIGGER_DEFAULTS } from './constants';
import { NodeHelpModal } from '../../components/NodeHelpModal';

interface TriggerNodeProps {
  data: TriggerNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function TriggerNodeController({ data }: TriggerNodeProps) {
  // Usar defaults si no hay configuración
  const config: TriggerNodeConfig = {
    ...TRIGGER_DEFAULTS,
    ...data.config,
  };

  return <TriggerNodeView config={config} meta={data.meta} />;
}

interface TriggerNodeViewProps {
  config: TriggerNodeConfig;
  meta?: TriggerNodeData['meta'];
}

const TriggerNodeView = React.memo(function TriggerNodeView({
  config,
  meta,
}: TriggerNodeViewProps) {
  
  const getStatusIndicator = () => {
    const status = meta?.status;
    switch (status) {
      case 'loading':
        return <Spinner />;
      case 'error':
        return (
          <span className="bg-red-500 text-white text-xs rounded-full px-1" title="Error">
            !
          </span>
        );
      case 'success':
        return (
          <span className="bg-green-500 text-white text-xs rounded-full px-1" title="Éxito">
            ✓
          </span>
        );
      default:
        return null;
    }
  };

  const getNodeBorderColor = () => {
    const status = meta?.status;
    switch (status) {
      case 'loading':
        return 'border-blue-500';
      case 'error':
        return 'border-red-500';
      case 'success':
        return 'border-green-500';
      default:
        return 'border-green-500';
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // TODO: Manejar interacción de teclado si es necesario
    }
  };

  const helpContent = useMemo(() => HELP_CONTENT, []);

  return (
    <div
      className={`group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 ${getNodeBorderColor()} min-w-[120px] ${
        meta?.status === 'loading' ? 'opacity-70' : ''
      }`}
      role="button"
      aria-label="Nodo Disparador Manual"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Solo handle de salida - el trigger no recibe entrada */}
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Inicio del flujo"
        className="w-3 h-3 border-2 border-green-500 bg-gray-800"
      />

      {/* Modal de ayuda */}
      <Suspense fallback={null}>
        <NodeHelpModal {...helpContent} />
      </Suspense>

      {/* Indicador de estado */}
      {getStatusIndicator() && (
        <div className="absolute top-1 right-1">
          {getStatusIndicator()}
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex items-center mb-1">
        <Zap className="h-4 w-4 mr-2 text-green-400" aria-hidden="true" />
        <div className="text-sm font-semibold truncate">
          {config.name || 'Disparador'}
        </div>
      </div>

      {/* Información específica del nodo */}
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="text-xs text-green-300">
          Punto de inicio
        </div>
      </div>

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[200px]">
          <div className="font-medium mb-1">{config.name || 'Disparador'}</div>
          <div className="space-y-1">
            <div><span className="text-green-400">Tipo:</span> Disparador Manual</div>
            <div><span className="text-green-400">Función:</span> Inicio del flujo</div>
            {config.description && (
              <div><span className="text-green-400">Descripción:</span> {config.description}</div>
            )}
            {meta?.lastExecution && (
              <div><span className="text-green-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
            )}
            {meta?.executionCount && (
              <div><span className="text-green-400">Ejecutado:</span> {meta.executionCount} veces</div>
            )}
          </div>
        </div>
      </div>

      {/* Badge de estado para debugging */}
      {process.env.NODE_ENV === 'development' && meta?.status && (
        <div className="absolute top-0 left-0 transform -translate-x-1 -translate-y-1">
          <div className={`text-xs px-1 rounded text-white ${
            meta.status === 'success' ? 'bg-green-600' :
            meta.status === 'error' ? 'bg-red-600' :
            meta.status === 'loading' ? 'bg-blue-600' :
            'bg-gray-600'
          }`}>
            {meta.status}
          </div>
        </div>
      )}
    </div>
  );
});

export const TriggerNode = React.memo(TriggerNodeController);