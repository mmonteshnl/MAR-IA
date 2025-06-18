import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, RefreshCw } from 'lucide-react';
import { NodeConfigProps } from '../types';

export function DataTransformSettings({ config, onChange }: NodeConfigProps) {
  const handleTransformationChange = (index: number, field: string, value: string) => {
    const transformations = config.transformations || [{}];
    transformations[index] = { ...transformations[index], [field]: value };
    onChange({ ...config, transformations });
  };

  const addTransformation = () => {
    const transformations = config.transformations || [];
    transformations.push({
      type: 'map',
      source: '',
      target: '',
      mapping: {}
    });
    onChange({ ...config, transformations });
  };

  const removeTransformation = (index: number) => {
    const transformations = config.transformations || [];
    transformations.splice(index, 1);
    onChange({ ...config, transformations });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-gray-300">JSON Transformations</Label>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={addTransformation}
          className="text-blue-400 border-blue-400 hover:bg-blue-900/20"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {(config.transformations || []).map((transform: any, index: number) => (
        <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-600 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              Transformation {index + 1}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => removeTransformation(index)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Source Data</Label>
              <Input
                value={transform.source || ''}
                onChange={(e) => handleTransformationChange(index, 'source', e.target.value)}
                placeholder="step_api-call-1"
                className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Target Name</Label>
              <Input
                value={transform.target || ''}
                onChange={(e) => handleTransformationChange(index, 'target', e.target.value)}
                placeholder="transformedData"
                className="bg-gray-700 border-gray-600 text-gray-100 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Field Mapping (JSON)</Label>
            <Textarea
              value={JSON.stringify(transform.mapping || {}, null, 2)}
              onChange={(e) => {
                try {
                  const mapping = JSON.parse(e.target.value);
                  handleTransformationChange(index, 'mapping', mapping);
                } catch (error) {
                  // Invalid JSON, don't update yet
                }
              }}
              placeholder={`{
  "leadName": "name",
  "pokemonType": "types[0].type.name",
  "stats": "stats"
}`}
              rows={4}
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono text-xs"
            />
          </div>
        </div>
      ))}

      {(!config.transformations || config.transformations.length === 0) && (
        <div className="text-center py-6 text-gray-400">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No transformations defined</p>
          <p className="text-xs">Click "Add" to create your first transformation</p>
        </div>
      )}

      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <Label className="text-xs text-gray-400 mb-2 block">💡 Field Mapping Examples:</Label>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-gray-300">"pokemonName": "name"</div>
          <div className="text-gray-300">"types": "types[].type.name"</div>
          <div className="text-gray-300">"firstType": "types[0].type.name"</div>
          <div className="text-gray-300">"height": "height"</div>
        </div>
      </div>
    </div>
  );
}