import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { HttpRequestConfig, HttpRequestNodeData } from './schema';
import { METHOD_COLORS, HELP_CONTENT, HTTP_REQUEST_DEFAULTS } from './constants';

interface HttpRequestNodeProps {
  data: HttpRequestNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function HttpRequestNodeController({ data }: HttpRequestNodeProps) {
  // Usar defaults si no hay configuración
  const config: HttpRequestConfig = {
    ...HTTP_REQUEST_DEFAULTS,
    ...data.config,
  };

  return <HttpRequestNodeView config={config} meta={data.meta} />;
}

interface HttpRequestNodeViewProps {
  config: HttpRequestConfig;
  meta?: HttpRequestNodeData['meta'];
}

const HttpRequestNodeView = React.memo(function HttpRequestNodeView({
  config,
  meta,
}: HttpRequestNodeViewProps) {
  const getMethodColor = (method: string) => {
    return METHOD_COLORS[method.toUpperCase() as keyof typeof METHOD_COLORS] || 'text-gray-400';
  };

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
        return 'border-purple-500';
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // TODO: abrir modal de ayuda o configuración
    }
  };

  const helpContent = useMemo(() => HELP_CONTENT, []);

  return (
    <div
      className={`group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 ${getNodeBorderColor()} min-w-[160px] ${
        meta?.status === 'loading' ? 'opacity-70' : ''
      }`}
      role="button"
      aria-label="Nodo HTTP Avanzado"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Handles de conexión */}
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Entrada HTTP"
        className="w-3 h-3 border-2 border-purple-500 bg-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Salida HTTP"
        className="w-3 h-3 border-2 border-purple-500 bg-gray-800"
      />

      {/* Modal de ayuda */}
      <Suspense fallback={null}>
        <NodeHelpModal {...helpContent} usage={[...helpContent.usage]} />
      </Suspense>

      {/* Indicador de estado */}
      {getStatusIndicator() && (
        <div className="absolute top-1 right-1">
          {getStatusIndicator()}
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex items-center mb-1">
        <Globe className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
        <div className="text-sm font-semibold truncate">
          {config.name || 'HTTP Request'}
        </div>
      </div>

      {/* Información de método y configuración */}
      <div className="flex items-center justify-between mt-1 gap-2">
        {config.method && (
          <div
            className={`text-xs uppercase font-mono font-bold ${getMethodColor(config.method)}`}
          >
            {config.method}
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {config.timeout && (
            <span title={`Timeout: ${config.timeout}s`}>
              ⏱️{config.timeout}s
            </span>
          )}
          {config.retries !== undefined && config.retries > 0 && (
            <span title={`Reintentos: ${config.retries}`}>
              ↻{config.retries}
            </span>
          )}
        </div>
      </div>

      {/* URL truncada */}
      {config.url && (
        <div
          className="text-xs mt-1 text-gray-300 truncate max-w-[140px]"
          title={config.url}
        >
          {config.url}
        </div>
      )}

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[200px]">
          <div className="font-medium mb-1">{config.name || 'HTTP Request'}</div>
          <div className="space-y-1">
            <div><span className="text-gray-400">URL:</span> {config.url || 'No configurada'}</div>
            <div><span className="text-gray-400">Método:</span> <span className={getMethodColor(config.method)}>{config.method}</span></div>
            {Object.keys(config.headers || {}).length > 0 && (
              <div><span className="text-gray-400">Headers:</span> {Object.keys(config.headers || {}).length} configurados</div>
            )}
            {config.body && (
              <div><span className="text-gray-400">Body:</span> Configurado</div>
            )}
            {meta?.lastExecution && (
              <div><span className="text-gray-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
            )}
            {meta?.executionCount && (
              <div><span className="text-gray-400">Ejecutado:</span> {meta.executionCount} veces</div>
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

export const HttpRequestNode = React.memo(HttpRequestNodeController);
  