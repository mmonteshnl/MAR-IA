import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NODE_TYPES } from '../types/nodeTypes';

export function NodesPanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-gray-100">Available Nodes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {NODE_TYPES.map((nodeType) => {
          const IconComponent = nodeType.icon;
          return (
            <div
              key={nodeType.type}
              className="flex items-center p-3 border border-gray-600 rounded-lg cursor-grab hover:bg-gray-700 transition-colors bg-gray-800"
              draggable
              onDragStart={(event) => onDragStart(event, nodeType.type)}
            >
              {typeof IconComponent === 'string' ? (
                <span className="text-xl mr-3">{IconComponent}</span>
              ) : (
                <IconComponent className="h-5 w-5 mr-3 text-blue-400" />
              )}
              <div>
                <div className="font-medium text-gray-100">{nodeType.label}</div>
                <div className="text-sm text-gray-300">{nodeType.description}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}