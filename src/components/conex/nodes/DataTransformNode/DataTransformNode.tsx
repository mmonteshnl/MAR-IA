import React from 'react';
import { Handle, Position } from 'reactflow';
import { RefreshCw } from 'lucide-react';
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { DataTransformNodeData } from './schema';
import { HELP_CONTENT } from './constants';

interface DataTransformNodeProps {
  data: DataTransformNodeData;
}

export function DataTransformNode({ data }: DataTransformNodeProps) {
  const transformationCount = data.config?.transformations?.length || 0;

  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-purple-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <NodeHelpModal {...HELP_CONTENT} />
      
      <div className="flex items-center">
        <RefreshCw className="h-4 w-4 mr-2 text-purple-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>
          {data.config?.name || 'Transformar'}
        </div>
      </div>
      
      {transformationCount > 0 && (
        <div className="text-xs mt-1 text-purple-300">
          {transformationCount} transformación{transformationCount !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );
}