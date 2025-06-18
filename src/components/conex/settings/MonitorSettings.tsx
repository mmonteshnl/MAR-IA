import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeConfigProps } from '../types';

export function MonitorSettings({ config, onChange }: NodeConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-300">Monitor Name</Label>
        <Input
          value={config.name || ''}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          placeholder="ej. Debug Lead Data"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">Nombre descriptivo para este monitor</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Campos a Mostrar</Label>
        <Textarea
          value={config.displayFields || ''}
          onChange={(e) => onChange({ ...config, displayFields: e.target.value })}
          placeholder="leadName,leadEmail,leadIndustry,leadValue"
          rows={3}
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 font-mono text-sm"
        />
        <p className="text-xs text-gray-400">Lista de campos separados por comas. Deja vacío para mostrar todo.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Formato de Salida</Label>
        <Select value={config.outputFormat || 'json'} onValueChange={(value) => onChange({ ...config, outputFormat: value })}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="json" className="text-gray-100 focus:bg-gray-600">JSON Pretty</SelectItem>
            <SelectItem value="table" className="text-gray-100 focus:bg-gray-600">Tabla</SelectItem>
            <SelectItem value="list" className="text-gray-100 focus:bg-gray-600">Lista Simple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enableTimestamp"
          checked={config.enableTimestamp || false}
          onChange={(e) => onChange({ ...config, enableTimestamp: e.target.checked })}
          className="rounded bg-gray-700 border-gray-600"
        />
        <Label htmlFor="enableTimestamp" className="text-gray-300 text-sm">
          Incluir timestamp
        </Label>
      </div>

      <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-3">
        <Label className="text-xs text-cyan-400 mb-2 block">🔍 ¿Cómo funciona?</Label>
        <div className="space-y-1 text-xs text-cyan-300">
          <p>• Los datos del flujo se capturan aquí</p>
          <p>• Se muestran en la consola del navegador</p>
          <p>• Útil para debugging y verificar transformaciones</p>
          <p>• No afecta el flujo, solo observa</p>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded border border-gray-600">
        <Label className="text-xs text-gray-400 mb-2 block">💡 Ejemplos de Campos:</Label>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-gray-300">leadName,leadEmail</div>
          <div className="text-gray-300">step_api-call-1.response</div>
          <div className="text-gray-300">step_pandadoc-1.documentId</div>
        </div>
      </div>
    </div>
  );
}