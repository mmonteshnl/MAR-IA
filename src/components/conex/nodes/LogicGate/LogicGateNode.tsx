import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings } from 'lucide-react';
import { LogicGateNodeData } from './schema';
import { HELP_CONTENT, LOGIC_GATE_DEFAULTS } from './constants';
import { NodeHelpModal } from '@/components/conex/components/NodeHelpModal';

interface LogicGateNodeProps {
  data: LogicGateNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function LogicGateNodeController({ data }: LogicGateNodeProps) {
  // Usar defaults si no hay configuración
  const config = {
    ...LOGIC_GATE_DEFAULTS,
    ...data.config,
  };

  return <LogicGateNodeView config={config} meta={data.meta} />;
}

interface LogicGateNodeViewProps {
  config: LogicGateNodeData['config'];
  meta?: LogicGateNodeData['meta'];
}

const LogicGateNodeView = React.memo(function LogicGateNodeView({
  config,
  meta,
}: LogicGateNodeViewProps) {
  
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
        return 'border-red-500';
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
      className={`group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 ${getNodeBorderColor()} min-w-[140px] ${
        meta?.status === 'loading' ? 'opacity-70' : ''
      }`}
      role="button"
      aria-label="Nodo Compuerta Lógica"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Handles de conexión */}
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Entrada de valores booleanos"
        className="w-3 h-3 border-2 border-red-500 bg-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Salida del resultado lógico"
        className="w-3 h-3 border-2 border-red-500 bg-gray-800"
      />

      {/* Modal de ayuda */}
      <Suspense fallback={null}>
        <NodeHelpModal
          {...helpContent}
          usage={[...helpContent.usage]}
          examples={helpContent.examples ? [...helpContent.examples] : []}
          tips={helpContent.tips ? [...helpContent.tips] : []}
        />
      </Suspense>

      {/* Indicador de estado */}
      {getStatusIndicator() && (
        <div className="absolute top-1 right-1">
          {getStatusIndicator()}
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex items-center mb-1">
        <Settings className="h-4 w-4 mr-2 text-red-400" aria-hidden="true" />
        <div className="text-sm font-semibold truncate">
          {config.name || 'Compuerta Lógica'}
        </div>
      </div>

      {/* Información específica del nodo */}
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="text-xs text-red-300">
          Tipo: {config.gateType || 'AND'}
        </div>
        <div className="text-xs text-gray-400">
          {meta?.executionCount ? `${meta.executionCount}x` : 'No ejecutado'}
        </div>
      </div>

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[200px]">
          <div className="font-medium mb-1">{config.name || 'Compuerta Lógica'}</div>
          <div className="space-y-1">
            <div><span className="text-red-400">Tipo:</span> Compuerta Lógica</div>
            <div><span className="text-red-400">Operador:</span> {config.gateType || 'AND'}</div>
            <div><span className="text-red-400">Entrada:</span> a, {config.gateType === 'NOT' ? '(b ignorado)' : 'b'}</div>
            <div><span className="text-red-400">Salida:</span> boolean</div>
            {meta?.lastExecution && (
              <div><span className="text-red-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
            )}
            {meta?.executionCount && (
              <div><span className="text-red-400">Ejecutado:</span> {meta.executionCount} veces</div>
            )}
            {meta?.lastResult !== undefined && (
              <div><span className="text-red-400">Último resultado:</span> {String(meta.lastResult)}</div>
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

export const LogicGateNode = React.memo(LogicGateNodeController);