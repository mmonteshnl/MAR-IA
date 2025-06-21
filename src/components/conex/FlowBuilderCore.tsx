import React, { useCallback, useState, useRef, useMemo, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Play, Save, Code, Copy, X, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { FlowBuilderProps } from './types';
import { nodeTypes } from './nodes';
import { NodesPanel, NodeSettings } from './panels';
import { getNodeLabel, getDefaultNodeConfig } from './types/nodeTypes';
import { useFlowExecutor } from '@/hooks/useFlowExecutor';

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Manual Trigger',
      config: {
        name: 'Manual Trigger',
        inputSchema: {}
      }
    },
  },
];

const initialEdges: Edge[] = [];

export const FlowBuilderCore = memo<FlowBuilderProps>(function FlowBuilderCore({ onSave, initialFlowData, loading }) {
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowData?.edges || initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeSettings, setShowNodeSettings] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [editableJson, setEditableJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [showTestModal, setShowTestModal] = useState(false);
  type TestData = {
    [key: string]: string | number;
  };

  // Memoized test data to prevent unnecessary re-renders
  const [testData, setTestData] = useState<TestData>(() => ({
    leadName: 'Lead de Prueba',
    leadEmail: 'prueba@ejemplo.com',
    leadPhone: '+1234567890',
    leadWebsite: 'https://ejemplo.com',
    leadStage: 'Interesado',
    leadSource: 'Website',
    leadIndustry: 'Tecnología',
    leadAddress: 'Dirección de Prueba',
    leadValue: 15000
  }));
  
  const { executeFlow, executing } = useFlowExecutor();

  // Memoized function to update nodes with execution results
  const updateNodesWithExecutionResults = useCallback((executionResults: Record<string, any>) => {
    setNodes((currentNodes) => 
      currentNodes.map((node) => {
        if (node.type === 'monitor') {
          const nodeResult = executionResults[node.id];
          if (nodeResult) {
            return {
              ...node,
              data: {
                ...node.data,
                meta: {
                  ...node.data.meta,
                  status: 'success',
                  lastExecution: new Date().toISOString(),
                  executionCount: (node.data.meta?.executionCount || 0) + 1,
                  receivedData: nodeResult.dataSnapshot || nodeResult,
                  formattedOutput: nodeResult.formattedOutput
                }
              }
            };
          }
        }
        return node;
      })
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) return;

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: { 
          label: getNodeLabel(type),
          config: getDefaultNodeConfig(type)
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowNodeSettings(true);
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSave = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const flowData = reactFlowInstance.toObject();
    onSave(flowData);
  }, [reactFlowInstance, onSave]);

  const getFlowJson = useCallback(() => {
    if (!reactFlowInstance) return null;
    return reactFlowInstance.toObject();
  }, [reactFlowInstance]);

  const copyJsonToClipboard = useCallback(() => {
    const flowData = getFlowJson();
    if (flowData) {
      navigator.clipboard.writeText(JSON.stringify(flowData, null, 2));
      toast({
        title: 'JSON Copiado',
        description: 'El JSON del flujo ha sido copiado al portapapeles',
      });
    }
  }, [getFlowJson]);

  const openJsonModal = useCallback(() => {
    const flowData = getFlowJson();
    if (flowData) {
      setEditableJson(JSON.stringify(flowData, null, 2));
      setJsonError('');
      setShowJsonModal(true);
    }
  }, [getFlowJson]);

  const validateAndApplyJson = useCallback(() => {
    try {
      const parsedData = JSON.parse(editableJson);
      
      // Validate required structure
      if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
        throw new Error('El JSON debe contener un array "nodes"');
      }
      if (!parsedData.edges || !Array.isArray(parsedData.edges)) {
        throw new Error('El JSON debe contener un array "edges"');
      }

      // Validate nodes structure
      for (const node of parsedData.nodes) {
        if (!node.id || !node.type || !node.position || !node.data) {
          throw new Error(`Nodo inválido: debe tener id, type, position y data`);
        }
      }

      // Validate edges structure
      for (const edge of parsedData.edges) {
        if (!edge.source || !edge.target) {
          throw new Error(`Edge inválido: debe tener source y target`);
        }
      }

      // Apply the changes
      setNodes(parsedData.nodes);
      setEdges(parsedData.edges);
      
      // Set viewport if provided
      if (parsedData.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(parsedData.viewport);
      }

      setJsonError('');
      setShowJsonModal(false);
      
      toast({
        title: 'Flujo Actualizado',
        description: 'El flujo se ha actualizado desde el JSON exitosamente',
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON inválido';
      setJsonError(errorMessage);
      toast({
        title: 'Error en JSON',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [editableJson, setNodes, setEdges, reactFlowInstance]);

  const resetJsonChanges = useCallback(() => {
    const flowData = getFlowJson();
    if (flowData) {
      setEditableJson(JSON.stringify(flowData, null, 2));
      setJsonError('');
    }
  }, [getFlowJson]);

  const handleTestFlow = useCallback(() => {
    setShowTestModal(true);
  }, []);

  const executeTestFlow = useCallback(async () => {
    if (!reactFlowInstance) return;
    setShowTestModal(false);

    try {
      const flowData = reactFlowInstance.toObject();
      
      const flowDefinition = {
        nodes: flowData.nodes.map(node => ({
          id: node.id,
          type: node.type ?? '',
          data: {
            name: (node.data.config?.name || node.data.label || node.type) ?? '',
            config: node.data.config || {}
          }
        })),
        edges: flowData.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target
        }))
      };
      
      const result = await executeFlow({
        inputData: testData,
        flowDefinition,
        enableLogs: true
      });
      
      if (result.status === 'completed' && result.stepResults) {
        updateNodesWithExecutionResults(result.stepResults);
      }
      
      toast({
        title: 'Flujo Ejecutado ✅',
        description: `Ejecución ${result.status === 'completed' ? 'completada' : 'falló'}. Revisa la consola para detalles.`,
        variant: result.status === 'completed' ? 'default' : 'destructive'
      });

    } catch (error) {
      toast({
        title: 'Error en Ejecución',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: 'destructive',
      });
    }
  }, [reactFlowInstance, testData, executeFlow, updateNodesWithExecutionResults]);

  const updateTestData = useCallback((field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      newData[field] = value;
      return newData;
    });
  }, []);

  const resetTestData = useCallback(() => {
    setTestData({
      leadName: 'Lead de Prueba',
      leadEmail: 'prueba@ejemplo.com',
      leadPhone: '+1234567890',
      leadWebsite: 'https://ejemplo.com',
      leadStage: 'Interesado',
      leadSource: 'Website',
      leadIndustry: 'Tecnología',
      leadAddress: 'Dirección de Prueba',
      leadValue: 15000
    });
  }, []);

  const setEmptyTestData = useCallback(() => {
    setTestData({
      leadName: '',
      leadEmail: '',
      leadPhone: '',
      leadWebsite: '',
      leadStage: '',
      leadSource: '',
      leadIndustry: '',
      leadAddress: '',
      leadValue: 0
    });
  }, []);

  const setMinimalTestData = useCallback(() => {
    setTestData({});
  }, []);

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    toast({
      title: 'Node Deleted',
      description: 'Node and its connections have been removed',
    });
  }, [setNodes, setEdges]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      event.preventDefault();
      deleteNode(selectedNode.id);
    }
  }, [selectedNode, deleteNode]);

  const handleCloseNodeSettings = useCallback(() => {
    setShowNodeSettings(false);
    setSelectedNode(null);
  }, []);

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-900 border-gray-700 p-4 space-y-4">
        <NodesPanel />
        {selectedNode && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">Nodo Seleccionado</h3>
            <p className="text-xs text-gray-400 mb-3">
              Nodo "{selectedNode.data.config?.name || selectedNode.data.label || selectedNode.type}" seleccionado.
            </p>
            <Button 
              onClick={() => setShowNodeSettings(true)}
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Nodo
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              También puedes hacer doble clic en un nodo para configurarlo
            </p>
          </div>
        )}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button onClick={openJsonModal} variant="outline">
            <Code className="h-4 w-4 mr-2" />
            Editar JSON
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Flujo'}
          </Button>
          <Button onClick={handleTestFlow} variant="outline" disabled={executing}>
            <Play className="h-4 w-4 mr-2" />
            {executing ? 'Ejecutando...' : 'Probar Flujo'}
          </Button>
        </div>

        <div className="h-full bg-gray-900" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-900"
          >
            <Controls className="bg-gray-800 border-gray-600" />
            <MiniMap 
              className="bg-gray-800 border-gray-600"
              nodeColor="rgb(59, 130, 246)"
              maskColor="rgb(0, 0, 0, 0.7)"
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color="#374151"
              className="bg-gray-900"
            />
          </ReactFlow>
        </div>
      </div>

      {/* JSON Editor Modal */}
      <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] bg-gray-900 border-gray-700 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="h-6 w-6 text-blue-400" />
                <div>
                  <div className="text-lg font-semibold">Editor JSON del Flujo</div>
                  <div className="text-xs text-gray-400 font-normal">Editor avanzado con herramientas de formateo y validación</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyJsonToClipboard}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  onClick={() => setShowJsonModal(false)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(editableJson);
                        setEditableJson(JSON.stringify(parsed, null, 2));
                        setJsonError('');
                        toast({ title: 'JSON Formateado', description: 'El JSON ha sido formateado correctamente' });
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'JSON inválido';
                        setJsonError(errorMessage);
                        toast({ title: 'Error de Formato', description: errorMessage, variant: 'destructive' });
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8"
                  >
                    🎨 Formatear
                  </Button>
                  <Button
                    onClick={() => {
                      setEditableJson(editableJson.replace(/\s+/g, ' ').trim());
                      toast({ title: 'JSON Comprimido', description: 'Se removieron espacios innecesarios' });
                    }}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8"
                  >
                    📦 Comprimir
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        JSON.parse(editableJson);
                        setJsonError('');
                        toast({ title: 'JSON Válido', description: 'La sintaxis JSON es correcta', variant: 'default' });
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'JSON inválido';
                        setJsonError(errorMessage);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8"
                  >
                    ✅ Validar
                  </Button>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex gap-2">
                  <Button
                    onClick={resetJsonChanges}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8"
                  >
                    ↶ Revertir
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-4">
                <span>Líneas: {editableJson.split('\n').length}</span>
                <span>Caracteres: {editableJson.length}</span>
                <span>Tamaño: {(editableJson.length / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Error Display */}
            {jsonError && (
              <div className="flex-shrink-0 bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-red-400 text-lg">⚠️</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-300 mb-1">Error de Validación JSON</h4>
                    <p className="text-xs text-red-200 bg-red-900/20 p-2 rounded border border-red-500/20 font-mono">{jsonError}</p>
                    <p className="text-xs text-red-300/70 mt-2">Revisa la sintaxis y corrige los errores antes de aplicar los cambios.</p>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Editor */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full bg-gray-850 rounded-lg border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-300 ml-2">flow.json</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                      JSON
                    </div>
                  </div>
                </div>
                <div className="relative h-[calc(100%-3.5rem)]">
                  <textarea
                    value={editableJson}
                    onChange={(e) => setEditableJson(e.target.value)}
                    className="w-full h-full bg-gray-850 text-gray-200 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-0 leading-relaxed pl-16"
                    placeholder='{\n  "nodes": [],\n  "edges": [],\n  "viewport": {\n    "x": 0,\n    "y": 0,\n    "zoom": 1\n  }\n}'
                    spellCheck={false}
                    style={{
                      tabSize: 2,
                      fontFamily: 'JetBrains Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                    }}
                  />
                  {/* Line numbers overlay */}
                  <div className="absolute left-0 top-0 w-12 h-full bg-gray-800/80 border-r border-gray-700 pointer-events-none">
                    <div className="p-4 text-xs text-gray-500 font-mono leading-relaxed">
                      {editableJson.split('\n').map((_, index) => (
                        <div key={index} className="h-5 flex items-center justify-end pr-2">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex-shrink-0 mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 text-xl">💡</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-blue-300 mb-3">Guía de Edición JSON</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-200/80">
                    <div>
                      <h6 className="font-medium text-blue-300 mb-2">📋 Estructura Principal</h6>
                      <ul className="space-y-1 list-disc list-inside pl-2">
                        <li><code className="bg-blue-900/30 px-1 rounded">nodes</code>: Array de nodos del flujo</li>
                        <li><code className="bg-blue-900/30 px-1 rounded">edges</code>: Array de conexiones</li>
                        <li><code className="bg-blue-900/30 px-1 rounded">viewport</code>: Vista del canvas (opcional)</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium text-blue-300 mb-2">🛠️ Herramientas</h6>
                      <ul className="space-y-1 list-disc list-inside pl-2">
                        <li><strong>Formatear:</strong> Organiza el JSON con indentación</li>
                        <li><strong>Comprimir:</strong> Elimina espacios innecesarios</li>
                        <li><strong>Validar:</strong> Verifica la sintaxis JSON</li>
                        <li><strong>Revertir:</strong> Restaura el estado original</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-700/20">
                    <p className="text-blue-200/70 text-xs">
                      <strong>Tip:</strong> Usa <kbd className="bg-blue-900/40 px-1 rounded text-blue-200">Ctrl/Cmd + A</kbd> para seleccionar todo, 
                      <kbd className="bg-blue-900/40 px-1 rounded text-blue-200">Tab</kbd> para indentar, y 
                      <kbd className="bg-blue-900/40 px-1 rounded text-blue-200">Ctrl/Cmd + Z</kbd> para deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {jsonError ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-400">JSON Inválido</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-400">JSON Válido</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowJsonModal(false)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
              >
                Cancelar
              </Button>
              <Button
                onClick={validateAndApplyJson}
                disabled={!!jsonError}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                Aplicar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Data Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Configurar Datos de Prueba
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-400">
              Configura los datos que se enviarán al disparador del flujo. Puedes modificar, vaciar o enviar datos incorrectos para probar diferentes escenarios.
            </p>
            
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-500 self-center">Presets:</span>
              <Button
                onClick={resetTestData}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
              >
                📋 Datos Completos
              </Button>
              <Button
                onClick={setEmptyTestData}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
              >
                🗑️ Datos Vacíos
              </Button>
              <Button
                onClick={setMinimalTestData}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
              >
                📦 Objeto Vacío {'{}'}
              </Button>
            </div>
            
            <div className="min-h-[200px]">
              {Object.keys(testData || {}).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-600 rounded-lg">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="text-lg font-medium text-gray-300">Objeto Vacío</div>
                  <div className="text-sm text-gray-500">El trigger recibirá: {'{}'}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Perfecto para probar cómo maneja tu flujo la ausencia de datos
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
                  {Object.entries(testData || {}).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </label>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value || ''}
                        onChange={(e) => updateTestData(key, typeof value === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Ingresa ${key.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Vista Previa JSON:</h4>
              <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-auto max-h-32">
                {testData ? JSON.stringify(testData, null, 2) : '{}'}
              </pre>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-xs text-gray-500">
                💡 Tip: Prueba con datos completos, campos vacíos, objeto vacío {'{}'} o datos inválidos para testear todos los escenarios
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowTestModal(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={executeTestFlow}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Prueba
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Settings Modal */}
      {selectedNode && (
        <NodeSettings
          node={selectedNode}
          onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
          onClose={handleCloseNodeSettings}
          onDelete={() => deleteNode(selectedNode.id)}
          isOpen={showNodeSettings}
        />
      )}
    </div>
  );
});