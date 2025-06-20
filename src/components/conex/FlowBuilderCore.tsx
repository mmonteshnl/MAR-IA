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
          <Button onClick={() => setShowJsonModal(true)} variant="outline">
            <Code className="h-4 w-4 mr-2" />
            Ver JSON
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

      {/* JSON Modal */}
      <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>JSON del Flujo</span>
              <div className="flex gap-2">
                <Button
                  onClick={copyJsonToClipboard}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
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
          <div className="mt-4">
            <div className="bg-gray-800 rounded-lg p-4 max-h-[60vh] overflow-auto">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(getFlowJson(), null, 2)}
              </pre>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Este JSON representa la estructura completa de tu flujo incluyendo nodos, conexiones y configuraciones.
            </p>
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