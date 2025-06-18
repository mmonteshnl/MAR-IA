import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NodeSettingsProps } from '../types';
import { 
  PandaDocSettings, 
  ApiCallSettings, 
  MonitorSettings, 
  DataTransformSettings 
} from '../settings';

export function NodeSettings({ node, onUpdate, onClose, onDelete }: NodeSettingsProps) {
  const [config, setConfig] = useState(node.data.config || {});

  const handleSave = () => {
    onUpdate(config);
    toast({
      title: 'Node Updated',
      description: 'Node configuration has been saved',
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-100">Node Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-blue-400 border-blue-400">{node.type}</Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            className="text-red-400 border-red-400 hover:bg-red-900/20 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label className="text-gray-300">Node Name</Label>
          <Input
            value={config.name || ''}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Enter node name"
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
          />
        </div>

        {node.type === 'apiCall' && (
          <ApiCallSettings config={config} onChange={setConfig} />
        )}

        {node.type === 'pandadocNode' && (
          <PandaDocSettings config={config} onChange={setConfig} />
        )}

        {node.type === 'dataTransform' && (
          <DataTransformSettings config={config} onChange={setConfig} />
        )}

        {node.type === 'monitor' && (
          <MonitorSettings config={config} onChange={setConfig} />
        )}

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          <Settings className="h-4 w-4 mr-2" />
          Update Node
        </Button>
        
        <div className="text-xs text-gray-400 mt-2">
          Press <kbd className="bg-gray-700 px-1 rounded">Delete</kbd> key to remove selected node
        </div>
      </CardContent>
    </Card>
  );
}