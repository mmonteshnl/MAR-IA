// LogicGateNode/LogicGateNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings } from 'lucide-react';
import { NodeHelpModal } from '../../components/NodeHelpModal';
import { LogicGateNodeData } from './schema';
import { HELP_CONTENT } from './constants';

interface LogicGateNodeProps {
  data: LogicGateNodeData;
}

export function LogicGateNode({ data }: LogicGateNodeProps) {
  return (
    <div className="group relative px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-red-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <NodeHelpModal {...HELP_CONTENT} />

      <div className="flex items-center">
        <Settings className="h-4 w-4 mr-2 text-red-400" />
        <div className="text-sm font-semibold">
          {data.config?.name || 'Compuerta Lógica'}
        </div>
      </div>

      <div className="text-xs mt-1 text-white">
        Operador: {data.config?.gateType || 'AND'}
      </div>
    </div>
  );
}

// LogicGateNode/LogicGateNodeSettings.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { LogicGateNodeConfig, LogicGateNodeConfigSchema } from './schema';

interface LogicGateNodeSettingsProps {
  config: LogicGateNodeConfig;
  onChange: (config: LogicGateNodeConfig) => void;
}

export function LogicGateNodeSettings({ config, onChange }: LogicGateNodeSettingsProps) {
  const updateConfig = (updates: Partial<LogicGateNodeConfig>) => {
    const newConfig = { ...config, ...updates };
    const validation = LogicGateNodeConfigSchema.safeParse(newConfig);
    if (validation.success) {
      onChange(validation.data);
    } else {
      toast({
        title: 'Error de Configuración',
        description: validation.error.errors[0]?.message || 'Configuración inválida',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">Configuración de Compuerta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Nombre del Nodo</Label>
            <Input
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="Compuerta Lógica"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Tipo de compuerta</Label>
            <select
              value={config.gateType}
              onChange={(e) => updateConfig({ gateType: e.target.value as LogicGateNodeConfig['gateType'] })}
              className="bg-gray-700 border-gray-600 text-gray-100 px-2 py-1 rounded w-full"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="NOT">NOT</option>
              <option value="NAND">NAND</option>
              <option value="NOR">NOR</option>
              <option value="XOR">XOR</option>
              <option value="XNOR">XNOR</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
