import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';

interface WhatsAppNodeProps {
  data: {
    label: string;
    config: {
      instanceId?: string;
      phoneNumber?: string;
      message?: string;
      messageTemplate?: string;
      useTemplate?: boolean;
      connectionStatus?: 'connected' | 'disconnected' | 'unknown';
      webhookPort?: string;
      variables?: {
        [key: string]: string;
      };
    };
    meta?: {
      executionCount?: number;
      lastExecution?: string;
      status?: 'success' | 'error' | 'pending';
    };
  };
  selected?: boolean;
}

export const WhatsAppNode = memo(({ data, selected }: WhatsAppNodeProps) => {
  const { config, meta } = data;
  
  const getConnectionIcon = () => {
    switch (config.connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-400" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-red-400" />;
      default:
        return <MessageSquare className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusIcon = () => {
    switch (meta?.status) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (config.connectionStatus === 'connected') {
      return 'border-green-500/30 bg-green-500/10';
    }
    if (config.connectionStatus === 'disconnected') {
      return 'border-red-500/30 bg-red-500/10';
    }
    return 'border-blue-500/30 bg-blue-500/10';
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all duration-200 min-w-[240px] ${
        selected 
          ? 'bg-blue-900/90 border-blue-400 shadow-blue-500/20' 
          : `bg-gray-800 border-gray-600 hover:border-gray-500 ${getStatusColor()}`
      }`}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-green-500 border-2 border-gray-700" 
      />
      
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
          <MessageSquare className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-white">
              {data.label}
            </div>
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              {getStatusIcon()}
            </div>
          </div>
          
          <div className="text-xs text-gray-300 mb-1">
            <span className="text-gray-400">Instancia:</span> {config.instanceId || 'No configurada'}
          </div>
          
          {config.phoneNumber && (
            <div className="text-xs text-gray-300 mb-1">
              <span className="text-gray-400">Número:</span> {config.phoneNumber}
            </div>
          )}
          
          <div className="text-xs text-gray-300 mb-1">
            <span className="text-gray-400">Mensaje:</span> {
              config.useTemplate 
                ? `Template (${Object.keys(config.variables || {}).length} vars)`
                : config.message 
                  ? config.message.substring(0, 20) + (config.message.length > 20 ? '...' : '')
                  : 'No configurado'
            }
          </div>
          
          {config.webhookPort && (
            <div className="text-xs text-gray-300">
              <span className="text-gray-400">Puerto:</span> {config.webhookPort}
            </div>
          )}
          
          {meta?.executionCount && (
            <div className="text-xs text-gray-400 mt-1">
              Ejecutado {meta.executionCount} veces
            </div>
          )}
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-green-500 border-2 border-gray-700" 
      />
    </div>
  );
});

WhatsAppNode.displayName = 'WhatsAppNode';