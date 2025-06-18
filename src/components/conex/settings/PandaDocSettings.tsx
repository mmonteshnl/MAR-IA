import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NodeConfigProps } from '../types';

export function PandaDocSettings({ config, onChange }: NodeConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-300">API Key de PandaDoc</Label>
        <Input
          type="password"
          value={config.apiKey || ''}
          onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
          placeholder="Ingresa tu API Key de PandaDoc"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">Se enviará como "Authorization: API-Key {tu-key}"</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Template UUID</Label>
        <Input
          value={config.templateId || ''}
          onChange={(e) => onChange({ ...config, templateId: e.target.value })}
          placeholder="UUID del template en PandaDoc"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">ID del template que usarás para generar documentos</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Nombre del Documento</Label>
        <Input
          value={config.documentName || ''}
          onChange={(e) => onChange({ ...config, documentName: e.target.value })}
          placeholder="Cotización para {{trigger.input.leadName}}"
          className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">Usa {'{{variable}}'} para valores dinámicos</p>
      </div>

      <div className="bg-orange-950/30 border border-orange-800/50 rounded-lg p-3">
        <Label className="text-xs text-orange-400 mb-2 block">💡 Variables Disponibles:</Label>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-orange-300">{'{{trigger.input.leadName}}'}</div>
          <div className="text-orange-300">{'{{trigger.input.leadEmail}}'}</div>
          <div className="text-orange-300">{'{{trigger.input.leadIndustry}}'}</div>
          <div className="text-orange-300">{'{{trigger.input.leadValue}}'}</div>
        </div>
      </div>
    </div>
  );
}