import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { DataFetcherNodeData } from './schema';
import { HELP_CONTENT, DATA_FETCHER_DEFAULTS } from './constants';
import { NodeHelpModal } from '@/components/conex/components/NodeHelpModal';

interface DataFetcherNodeProps {
  data: DataFetcherNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function DataFetcherNodeController({ data }: DataFetcherNodeProps) {
  // Usar defaults si no hay configuración
  const config = {
    ...DATA_FETCHER_DEFAULTS,
    ...data.config,
  };

  return <DataFetcherNodeView config={config} meta={data.meta} />;
}

interface DataFetcherNodeViewProps {
  config: DataFetcherNodeData['config'];
  meta?: DataFetcherNodeData['meta'];
}

const DataFetcherNodeView = React.memo(function DataFetcherNodeView({
  config,
  meta,
}: DataFetcherNodeViewProps) {
  // Hooks para verificar autenticación
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  
  const isAuthenticated = !!(user?.uid && currentOrganization?.id);
  
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
        return 'border-blue-500';
    }
  };

  const getModeIcon = () => {
    switch (config.fetchMode) {
      case 'all':
        return '📊';
      case 'byId':
        return '🔍';
      case 'byRange':
        return '📄';
      default:
        return '📁';
    }
  };

  const getModeLabel = () => {
    switch (config.fetchMode) {
      case 'all':
        return 'Todos';
      case 'byId':
        return 'Por ID';
      case 'byRange':
        return 'Rango';
      default:
        return 'N/A';
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
      aria-label="Nodo Obtener Datos"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Handles de conexión */}
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Entrada de parámetros de búsqueda"
        className="w-3 h-3 border-2 border-blue-500 bg-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Salida de datos obtenidos"
        className="w-3 h-3 border-2 border-blue-500 bg-gray-800"
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

      {/* Indicadores de estado */}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        {/* Indicador de autenticación */}
        {isAuthenticated && (
          <div 
            className="bg-green-600 text-white text-xs rounded-full px-1 h-4 w-4 flex items-center justify-center" 
            title="Conectado con datos reales"
          >
            <Shield className="h-2 w-2" />
          </div>
        )}
        
        {/* Indicador de estado de ejecución */}
        {getStatusIndicator()}
      </div>

      {/* Contenido principal */}
      <div className="flex items-center mb-1">
        <Database className="h-4 w-4 mr-2 text-blue-400" aria-hidden="true" />
        <div className="text-sm font-semibold truncate">
          {config.name || 'Obtener Datos'}
        </div>
      </div>

      {/* Información específica del nodo */}
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="text-xs text-blue-300 flex items-center gap-1">
          <span>{getModeIcon()}</span>
          <span>{getModeLabel()}</span>
        </div>
        <div className="text-xs text-gray-400">
          {meta?.lastResultCount !== undefined ? `${meta.lastResultCount} reg.` : 'No ejecutado'}
        </div>
      </div>

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[220px]">
          <div className="font-medium mb-1">{config.name || 'Obtener Datos'}</div>
          <div className="space-y-1">
            <div><span className="text-blue-400">Tipo:</span> Data Fetcher</div>
            <div><span className="text-blue-400">Modo:</span> {getModeLabel()}</div>
            <div><span className="text-blue-400">Colección:</span> {config.collection}</div>
            
            {/* Información de conexión */}
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-400" />
                <span className="text-green-400 text-xs">
                  {isAuthenticated ? 'Datos reales' : 'Sin autenticación'}
                </span>
              </div>
              {isAuthenticated && (
                <>
                  <div className="text-xs"><span className="text-blue-400">Org:</span> {currentOrganization?.name}</div>
                  <div className="text-xs"><span className="text-blue-400">Usuario:</span> {user?.email}</div>
                </>
              )}
            </div>
            
            {config.fetchMode === 'byId' && config.targetId && (
              <div><span className="text-blue-400">ID:</span> {config.targetId}</div>
            )}
            
            {config.fetchMode === 'byRange' && config.rangeConfig && (
              <div><span className="text-blue-400">Límite:</span> {config.rangeConfig.limit}</div>
            )}
            
            {config.filters && Object.keys(config.filters).length > 0 && (
              <div><span className="text-blue-400">Filtros:</span> {Object.keys(config.filters).length}</div>
            )}
            
            {meta?.lastExecution && (
              <div><span className="text-blue-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
            )}
            
            {meta?.executionCount && (
              <div><span className="text-blue-400">Ejecutado:</span> {meta.executionCount} veces</div>
            )}
            
            {meta?.lastResultCount !== undefined && (
              <div><span className="text-blue-400">Último resultado:</span> {meta.lastResultCount} registros</div>
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

export const DataFetcherNode = React.memo(DataFetcherNodeController);