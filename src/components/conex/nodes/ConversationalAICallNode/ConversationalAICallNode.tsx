// Componente visual para el nodo ConversationalAICall
import React, { useMemo, Suspense, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import { Phone, PhoneCall, Clock, AlertCircle } from 'lucide-react';
import { ConversationalAICallNodeData } from './schema';
import { HELP_CONTENT, CONVERSATIONAL_AI_CALL_NODE } from './constants';
import { NodeHelpModal } from '@/components/conex/components/NodeHelpModal';

interface ConversationalAICallNodeProps {
  data: ConversationalAICallNodeData;
}

function Spinner() {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white border-t-transparent w-3 h-3"
      aria-hidden="true"
    />
  );
}

function ConversationalAICallNodeController({ data }: ConversationalAICallNodeProps) {
  // Usar defaults si no hay configuración
  const config = {
    name: 'Llamada IA Conversacional',
    agentId: '',
    phoneField: 'phone',
    maxDuration: 600,
    ...data.config,
  };

  return <ConversationalAICallNodeView config={config} meta={data.meta} />;
}

interface ConversationalAICallNodeViewProps {
  config: ConversationalAICallNodeData['config'];
  meta?: ConversationalAICallNodeData['meta'];
}

const ConversationalAICallNodeView = React.memo(function ConversationalAICallNodeView({
  config,
  meta,
}: ConversationalAICallNodeViewProps) {
  
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
        return 'border-emerald-500';
    }
  };

  const getMainIcon = () => {
    const status = meta?.status;
    switch (status) {
      case 'loading':
        return <PhoneCall className="h-4 w-4 mr-2 text-emerald-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-2 text-red-400" />;
      case 'success':
        return <Phone className="h-4 w-4 mr-2 text-green-400" />;
      default:
        return <Phone className="h-4 w-4 mr-2 text-emerald-400" />;
    }
  };

  const getDurationDisplay = () => {
    if (config.maxDuration) {
      const minutes = Math.floor(config.maxDuration / 60);
      const seconds = config.maxDuration % 60;
      if (minutes > 0) {
        return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
      }
      return `${seconds}s`;
    }
    return '10m';
  };

  const getPhoneFieldDisplay = () => {
    return config.phoneField || 'phone';
  };

  const hasAgentId = !!(config.agentId && config.agentId.length > 0);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // TODO: Manejar interacción de teclado si es necesario
    }
  };

  const helpContent = useMemo(() => HELP_CONTENT, []);

  return (
    <div
      className={`group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 ${getNodeBorderColor()} min-w-[160px] ${
        meta?.status === 'loading' ? 'opacity-70' : ''
      }`}
      role="button"
      aria-label="Nodo Llamada IA Conversacional"
      tabIndex={0}
      style={{ color: 'white' }}
      onKeyDown={onKeyDown}
    >
      {/* Handles de conexión */}
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Datos del lead para llamada"
        className="w-3 h-3 border-2 border-emerald-500 bg-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Resultado de la llamada"
        className="w-3 h-3 border-2 border-emerald-500 bg-gray-800"
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
        {/* Indicador de configuración */}
        {hasAgentId && (
          <div 
            className="bg-emerald-600 text-white text-xs rounded-full px-1 h-4 w-4 flex items-center justify-center" 
            title="Agent ID configurado"
          >
            ✓
          </div>
        )}
        
        {!hasAgentId && (
          <div 
            className="bg-orange-600 text-white text-xs rounded-full px-1 h-4 w-4 flex items-center justify-center" 
            title="Agent ID no configurado"
          >
            !
          </div>
        )}
        
        {/* Indicador de estado de ejecución */}
        {getStatusIndicator()}
      </div>

      {/* Contenido principal */}
      <div className="flex items-center mb-1">
        {getMainIcon()}
        <div className="text-sm font-semibold truncate">
          {config.name || 'Llamada IA Conversacional'}
        </div>
      </div>

      {/* Información específica del nodo */}
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="text-xs text-emerald-300 flex items-center gap-1">
          <span>📞</span>
          <span>{getPhoneFieldDisplay()}</span>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{getDurationDisplay()}</span>
        </div>
      </div>

      {/* Información adicional en hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 shadow-lg min-w-[280px]">
          <div className="font-medium mb-1">{config.name || 'Llamada IA Conversacional'}</div>
          <div className="space-y-1">
            <div><span className="text-emerald-400">Tipo:</span> Llamada IA Conversacional</div>
            <div><span className="text-emerald-400">Campo teléfono:</span> {getPhoneFieldDisplay()}</div>
            <div><span className="text-emerald-400">Duración máx:</span> {getDurationDisplay()}</div>
            
            {/* Información de configuración */}
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div><span className="text-emerald-400">Agent ID:</span> {
                hasAgentId ? 
                  `${config.agentId.substring(0, 8)}...` : 
                  'No configurado'
              }</div>
              
              {config.voiceId && (
                <div><span className="text-emerald-400">Voice ID:</span> {config.voiceId.substring(0, 8)}...</div>
              )}
              
              {config.instructionsTemplate && (
                <div><span className="text-emerald-400">Instrucciones:</span> {
                  config.instructionsTemplate.length > 30 ? 
                    `${config.instructionsTemplate.substring(0, 30)}...` : 
                    config.instructionsTemplate
                }</div>
              )}
            </div>
            
            {/* Información de ejecución */}
            {meta && (
              <div className="border-t border-gray-600 pt-1 mt-1">
                {meta.lastExecution && (
                  <div><span className="text-emerald-400">Última ejecución:</span> {new Date(meta.lastExecution).toLocaleTimeString()}</div>
                )}
                
                {meta.executionCount !== undefined && (
                  <div><span className="text-emerald-400">Ejecutado:</span> {meta.executionCount} veces</div>
                )}
                
                {meta.lastCallId && (
                  <div><span className="text-emerald-400">Última llamada:</span> {meta.lastCallId.substring(0, 8)}...</div>
                )}
                
                {meta.lastError && (
                  <div className="text-red-400"><span className="text-emerald-400">Último error:</span> {
                    meta.lastError.length > 40 ? 
                      `${meta.lastError.substring(0, 40)}...` : 
                      meta.lastError
                  }</div>
                )}
              </div>
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

      {/* Badge de configuración */}
      {!hasAgentId && (
        <div className="absolute -bottom-1 -right-1">
          <div className="bg-orange-500 text-white text-xs px-1 rounded">
            Config
          </div>
        </div>
      )}
    </div>
  );
});

export const ConversationalAICallNode = React.memo(ConversationalAICallNodeController);