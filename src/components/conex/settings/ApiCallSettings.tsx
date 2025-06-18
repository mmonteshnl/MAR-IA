import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeConfigProps } from '../types';

export function ApiCallSettings({ config, onChange }: NodeConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-300">Connection</Label>
        <Input
          value={config.connectionId || ''}
          onChange={(e) => onChange({ ...config, connectionId: e.target.value })}
          placeholder="pokemon-api-connection"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">ID of the connection to use</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">HTTP Method</Label>
        <Select value={config.method || 'GET'} onValueChange={(value) => onChange({ ...config, method: value })}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="GET" className="text-gray-100 focus:bg-gray-600">GET</SelectItem>
            <SelectItem value="POST" className="text-gray-100 focus:bg-gray-600">POST</SelectItem>
            <SelectItem value="PUT" className="text-gray-100 focus:bg-gray-600">PUT</SelectItem>
            <SelectItem value="DELETE" className="text-gray-100 focus:bg-gray-600">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">URL Template</Label>
        <Input
          value={config.url || ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://pokeapi.co/api/v2/pokemon/{{trigger.input.leadName}}"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">Use {'{{variable}}'} for dynamic values</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Headers (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.headers || {}, null, 2)}
          onChange={(e) => {
            if (!e.target.value.trim()) {
              onChange({ ...config, headers: {} });
              return;
            }
            try {
              const headers = JSON.parse(e.target.value);
              onChange({ ...config, headers });
            } catch (error) {
              // Invalid JSON, don't update yet
            }
          }}
          placeholder={`{
  "Content-Type": "application/json",
  "Accept": "application/json"
}`}
          rows={3}
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Request Body (JSON)</Label>
        <Textarea
          value={JSON.stringify(config.body || {}, null, 2)}
          onChange={(e) => {
            try {
              const body = e.target.value.trim() ? JSON.parse(e.target.value) : {};
              onChange({ ...config, body });
            } catch (error) {
              // Invalid JSON, don't update yet
            }
          }}
          placeholder={`{
  "leadName": "{{trigger.input.leadName}}",
  "stage": "{{trigger.input.leadStage}}"
}`}
          rows={4}
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono"
        />
        <p className="text-xs text-gray-400">Leave empty for GET requests</p>
      </div>

      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <Label className="text-xs text-gray-400 mb-2 block">💡 Template Variables:</Label>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-gray-300">{'{{trigger.input.leadName}}'}</div>
          <div className="text-gray-300">{'{{trigger.input.leadEmail}}'}</div>
          <div className="text-gray-300">{'{{step_node-id.fieldName}}'}</div>
        </div>
      </div>
    </div>
  );
}