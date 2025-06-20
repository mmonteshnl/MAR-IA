import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LogicGateNodeConfig, LogicGateNodeConfigSchema } from './schema';
import { LOGIC_GATE_DEFAULTS, HELP_CONTENT } from './constants';

interface LogicGateNodeSettingsProps {
  config: LogicGateNodeConfig;
  onChange: (config: LogicGateNodeConfig) => void;
  onClose?: () => void;
}

export function LogicGateNodeSettings({ config, onChange, onClose }: LogicGateNodeSettingsProps) {
  const [currentConfig, setCurrentConfig] = useState<LogicGateNodeConfig>({
    ...LOGIC_GATE_DEFAULTS,
    ...config,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Función para actualizar configuración y validar
  const updateConfig = (newConfig: LogicGateNodeConfig) => {
    setCurrentConfig(newConfig);
    
    // Validar configuración usando Zod schema
    const validation = LogicGateNodeConfigSchema.safeParse(newConfig);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  // Función para manejar cambios en fields básicos
  const handleBasicChange = (field: string, value: any) => {
    const newConfig = { ...currentConfig, [field]: value };
    updateConfig(newConfig);
  };

  // Función para guardar cambios
  const handleSave = () => {
    if (validationErrors.length === 0) {
      onChange(currentConfig);
      onClose?.();
      toast({
        title: 'Configuración Guardada',
        description: 'Los cambios se han aplicado correctamente',
      });
    }
  };

  // Información sobre las compuertas
  const gateDescriptions = {
    AND: 'Verdadero solo si ambas entradas son verdaderas',
    OR: 'Verdadero si al menos una entrada es verdadera',
    NOT: 'Invierte el valor de la entrada (solo usa entrada A)',
    NAND: 'Falso solo si ambas entradas son verdaderas',
    NOR: 'Falso si al menos una entrada es verdadera',
    XOR: 'Verdadero si las entradas son diferentes',
    XNOR: 'Verdadero si las entradas son iguales'
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-900/50 rounded-lg border border-red-700">
            <Settings className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Compuerta Lógica</h2>
            <p className="text-sm text-gray-400">Configura operaciones lógicas entre valores booleanos</p>
          </div>
        </div>
      </div>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <Card className="border-red-700 bg-red-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-300">Errores de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-400">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Configuración principal */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-200">Configuración</CardTitle>
          <CardDescription className="text-gray-400">Nombre del nodo y tipo de compuerta lógica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300 text-xs">Nombre del Nodo</Label>
            <Input
              id="name"
              value={currentConfig.name || ''}
              onChange={(e) => handleBasicChange('name', e.target.value)}
              placeholder="Ej: Validación AND"
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gateType" className="text-gray-300 text-xs">Tipo de Compuerta</Label>
            <Select
              value={currentConfig.gateType}
              onValueChange={(value) => handleBasicChange('gateType', value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="AND" className="text-gray-100">AND - Y lógico</SelectItem>
                <SelectItem value="OR" className="text-gray-100">OR - O lógico</SelectItem>
                <SelectItem value="NOT" className="text-gray-100">NOT - Negación</SelectItem>
                <SelectItem value="NAND" className="text-gray-100">NAND - Y negado</SelectItem>
                <SelectItem value="NOR" className="text-gray-100">NOR - O negado</SelectItem>
                <SelectItem value="XOR" className="text-gray-100">XOR - O exclusivo</SelectItem>
                <SelectItem value="XNOR" className="text-gray-100">XNOR - O exclusivo negado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Descripción de la compuerta seleccionada */}
            <div className="p-3 bg-gray-900 rounded border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">
                  Compuerta {currentConfig.gateType}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {gateDescriptions[currentConfig.gateType as keyof typeof gateDescriptions]}
              </p>
              {currentConfig.gateType === 'NOT' && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ La compuerta NOT solo utiliza la entrada A, ignorando la entrada B
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de verdad mejorada */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            📊 Tabla de Verdad - <span className="text-red-400 font-mono">{currentConfig.gateType}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-600">
            {currentConfig.gateType === 'NOT' ? (
              // Tabla para NOT (solo 2 columnas)
              <div className="bg-gray-900">
                {/* Header */}
                <div className="grid grid-cols-2 bg-gradient-to-r from-red-600 to-red-700">
                  <div className="px-4 py-3 text-center font-bold text-white text-sm border-r border-red-500">
                    Entrada A
                  </div>
                  <div className="px-4 py-3 text-center font-bold text-white text-sm">
                    Resultado
                  </div>
                </div>
                
                {/* Filas de datos */}
                {[
                  { a: true, result: false },
                  { a: false, result: true }
                ].map((row, index) => (
                  <div key={index} className={`grid grid-cols-2 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                    <div className="px-4 py-2 text-center border-r border-gray-600">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        row.a ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {row.a ? '1' : '0'}
                      </span>
                    </div>
                    <div className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        row.result ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {row.result ? '1' : '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Tabla para operaciones binarias (3 columnas)
              <div className="bg-gray-900">
                {/* Header */}
                <div className="grid grid-cols-3 bg-gradient-to-r from-red-600 to-red-700">
                  <div className="px-4 py-3 text-center font-bold text-white text-sm border-r border-red-500">
                    Entrada A
                  </div>
                  <div className="px-4 py-3 text-center font-bold text-white text-sm border-r border-red-500">
                    Entrada B
                  </div>
                  <div className="px-4 py-3 text-center font-bold text-white text-sm">
                    Resultado
                  </div>
                </div>
                
                {/* Filas de datos */}
                {[
                  { a: true, b: true },
                  { a: true, b: false },
                  { a: false, b: true },
                  { a: false, b: false }
                ].map((row, index) => {
                  // Calcular resultado según la compuerta
                  let result = false;
                  switch (currentConfig.gateType) {
                    case 'AND': result = row.a && row.b; break;
                    case 'OR': result = row.a || row.b; break;
                    case 'NAND': result = !(row.a && row.b); break;
                    case 'NOR': result = !(row.a || row.b); break;
                    case 'XOR': result = row.a !== row.b; break;
                    case 'XNOR': result = row.a === row.b; break;
                  }
                  
                  return (
                    <div key={index} className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                      <div className="px-4 py-2 text-center border-r border-gray-600">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          row.a ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {row.a ? '1' : '0'}
                        </span>
                      </div>
                      <div className="px-4 py-2 text-center border-r border-gray-600">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          row.b ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {row.b ? '1' : '0'}
                        </span>
                      </div>
                      <div className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          result ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        }`}>
                          {result ? '1' : '0'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Leyenda */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">1</span>
              <span className="text-gray-400">Verdadero (True)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">0</span>
              <span className="text-gray-400">Falso (False)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda y documentación */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-gray-300">📚 Ayuda y Documentación</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 space-y-2">
          <div>
            Este nodo evalúa una compuerta lógica entre dos valores booleanos de entrada.
          </div>
          <div>
            <strong>Entrada esperada:</strong> <code>{`{ a: boolean, b?: boolean }`}</code>
          </div>
          <div>
            <strong>Salida:</strong> <code>boolean</code> (resultado de la operación lógica)
          </div>
          <div>
            <strong>Uso común:</strong> Validaciones condicionales, filtros de datos, lógica de flujo
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={validationErrors.length > 0}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}