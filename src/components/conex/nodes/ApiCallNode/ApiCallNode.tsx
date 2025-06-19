import React from 'react';
import { Handle, Position } from 'reactflow';
import { Link } from 'lucide-react';
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { ApiCallNodeData } from './schema';
import { HELP_CONTENT } from './constants';

interface ApiCallNodeProps {
  data: ApiCallNodeData;
}

export function ApiCallNode({ data }: ApiCallNodeProps) {
  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-blue-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...HELP_CONTENT} />
      
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