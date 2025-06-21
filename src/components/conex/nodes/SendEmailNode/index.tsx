import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Mail } from 'lucide-react';

interface SendEmailNodeProps {
  data: {
    label: string;
    config: {
      from?: string;
      to?: string;
      subject?: string;
      bodyTemplate?: string;
    };
  };
  selected?: boolean;
}

export const SendEmailNode = memo(({ data, selected }: SendEmailNodeProps) => {
  const { config } = data;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all duration-200 min-w-[220px] ${
        selected 
          ? 'bg-blue-900/90 border-blue-400 shadow-blue-500/20' 
          : 'bg-gray-800 border-gray-600 hover:border-gray-500'
      }`}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-green-500 border-2 border-gray-700" 
      />
      
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
          <Mail className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white mb-1">
            {data.label}
          </div>
          <div className="text-xs text-gray-300 mb-1">
            <span className="text-gray-400">De:</span> {config.from || 'No configurado'}
          </div>
          <div className="text-xs text-gray-300 mb-1">
            <span className="text-gray-400">Para:</span> {config.to || 'No configurado'}
          </div>
          {config.subject && (
            <div className="text-xs text-gray-300 truncate">
              <span className="text-gray-400">Asunto:</span> {config.subject}
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

SendEmailNode.displayName = 'SendEmailNode';