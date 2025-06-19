import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Monitor } from 'lucide-react'; // TODO: Cambiar por icono apropiado
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { MonitorNodeConfig, MonitorNodeData } from './schema';
import { HELP_CONTENT, MONITOR_DEFAULTS } from './constants';

interface MonitorNodeProps {
  data: MonitorNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function MonitorNodeController({ data }: MonitorNodeProps) {
  // Usar defaults si no hay configuración
  const config: MonitorNodeConfig = {
    ...MONITOR_DEFAULTS,
    ...data.config,
  };

  return <MonitorNodeView config={config} meta={data.meta} />;
}

interface MonitorNodeViewProps {
  config: MonitorNodeConfig;
  meta?: MonitorNodeData['meta'];
}

const MonitorNodeView = React.memo(function MonitorNodeView({
  config,
  meta,
}: MonitorNodeViewProps) {
  
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
        return 'border-cyan-500';
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
      aria-label="Nodo Monitor de Debug"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Handles de conexión */}
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Entrada de datos"
        className="w-3 h-3 border-2 border-cyan-500 bg-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Salida de datos"
        className="w-3 h-3 border-2 border-cyan-500 bg-gray-800"
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
        <Monitor className="h-4 w-4 mr-2 text-cyan-400" aria-hidden="true" />
        <div className="text-sm font-semibold truncate">
          {config.name || 'Monitor'}
        </div>
      </div>

      {/* Información específica del Monitor */}
      <div className="flex items-center justify-between mt-1 gap-2">
        {config.displayFields && (
          <div className="text-xs font-mono text-cyan-300">
            Mostrando: {config.displayFields.split(',').length} campos
          </div>
        )}
        {config.outputFormat && (
          <div className="text-xs text-cyan-400 uppercase">
            {config.outputFormat}
          </div>
        )}
      </div>

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[200px]">
          <div className="font-medium mb-1">{config.name || 'Monitor'}</div>
          <div className="space-y-1">
            <div><span className="text-cyan-400">Tipo:</span> Monitor de Debug</div>
            <div><span className="text-cyan-400">Formato:</span> {config.outputFormat || 'json'}</div>
            {config.displayFields && (
              <div><span className="text-cyan-400">Campos filtrados:</span> {config.displayFields.split(',').length}</div>
            )}
            <div><span className="text-cyan-400">Timestamp:</span> {config.enableTimestamp ? 'Activado' : 'Desactivado'}</div>
            {meta?.lastExecution && (
              <div><span className="text-cyan-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
            )}
            {meta?.executionCount && (
              <div><span className="text-cyan-400">Ejecutado:</span> {meta.executionCount} veces</div>
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

export const MonitorNode = React.memo(MonitorNodeController);