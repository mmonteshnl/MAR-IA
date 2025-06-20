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
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } min-w-[200px]`}
    >
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <Mail className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            De: {config.from || 'No configurado'}
          </div>
          <div className="text-xs text-gray-500">
            Para: {config.to || 'No configurado'}
          </div>
          {config.subject && (
            <div className="text-xs text-gray-500 truncate max-w-[150px]">
              Asunto: {config.subject}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
});

SendEmailNode.displayName = 'SendEmailNode';