'use client';

import React, { useCallback, useState, useRef } from 'react';
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
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Play, Save, Settings, Zap, Link, RefreshCw, Plus, Trash2, X, Monitor } from 'lucide-react';

// Custom Node Components (forward declarations)
function TriggerNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-green-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <Zap className="h-4 w-4 mr-2 text-green-400" />
        <div className="text-sm font-semibold" style={{ color: 'white !important' }}>{data.config?.name || 'Trigger'}</div>
      </div>
    </div>
  );
}

function ApiCallNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-blue-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <Link className="h-4 w-4 mr-2 text-blue-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>{data.config?.name || 'API Call'}</div>
      </div>
      {data.config?.method && (
        <div className="text-xs mt-1 uppercase font-mono" style={{ color: '#d1d5db' }}>{data.config.method}</div>
      )}
    </div>
  );
}

function PandaDocNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-orange-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <span className="text-lg mr-2">📄</span>
        <div className="text-sm font-semibold" style={{ color: 'white' }}>{data.config?.name || 'PandaDoc'}</div>
      </div>
      {data.config?.templateId && (
        <div className="text-xs mt-1 font-mono" style={{ color: '#fed7aa' }}>Template: {data.config.templateId.slice(0, 8)}...</div>
      )}
    </div>
  );
}

function DataTransformNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-purple-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <RefreshCw className="h-4 w-4 mr-2 text-purple-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>{data.config?.name || 'Transform'}</div>
      </div>
    </div>
  );
}

function MonitorNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-cyan-500 min-w-[120px]" style={{ color: 'white' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center">
        <Monitor className="h-4 w-4 mr-2 text-cyan-400" />
        <div className="text-sm font-semibold" style={{ color: 'white' }}>{data.config?.name || 'Monitor'}</div>
      </div>
      {data.config?.displayFields && (
        <div className="text-xs mt-1 font-mono" style={{ color: '#67e8f9' }}>
          Showing: {data.config.displayFields.split(',').length} fields
        </div>
      )}
    </div>
  );
}

// Node types
const nodeTypes = {
  trigger: TriggerNode,
  apiCall: ApiCallNode,
  pandadocNode: PandaDocNode,
  dataTransform: DataTransformNode,
  monitor: MonitorNode,
};

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

interface FlowBuilderProps {
  onSave: (flowData: { nodes: Node[]; edges: Edge[] }) => void;
  initialFlowData?: { nodes: Node[]; edges: Edge[] };
  loading?: boolean;
}

function FlowBuilderInner({ onSave, initialFlowData, loading }: FlowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowData?.edges || initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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

  const handleSave = () => {
    if (!reactFlowInstance) return;
    
    const flowData = reactFlowInstance.toObject();
    onSave(flowData);
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    toast({
      title: 'Node Deleted',
      description: 'Node and its connections have been removed',
    });
  };

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      event.preventDefault();
      deleteNode(selectedNode.id);
    }
  }, [selectedNode]);

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
          <NodeSettings
            node={selectedNode}
            onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
            onClose={() => setSelectedNode(null)}
            onDelete={() => deleteNode(selectedNode.id)}
          />
        )}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Flow'}
          </Button>
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Test Flow
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
    </div>
  );
}

// Nodes Panel Component
function NodesPanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodeTypes = [
    { type: 'trigger', label: 'Manual Trigger', icon: Zap, description: 'Start flow manually' },
    { type: 'pandadocNode', label: 'PandaDoc', icon: '📄', description: 'Generate documents & quotes' },
    { type: 'apiCall', label: 'Generic API', icon: Link, description: 'Make HTTP request' },
    { type: 'dataTransform', label: 'Data Transform', icon: RefreshCw, description: 'Transform data' },
    { type: 'monitor', label: 'Monitor', icon: Monitor, description: 'Debug & view data flow' },
  ];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-gray-100">Available Nodes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeTypes.map((nodeType) => {
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

// Node Settings Panel
interface NodeSettingsProps {
  node: Node;
  onUpdate: (config: any) => void;
  onClose: () => void;
  onDelete: () => void;
}

function NodeSettings({ node, onUpdate, onClose, onDelete }: NodeSettingsProps) {
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

// PandaDoc Settings
function PandaDocSettings({ config, onChange }: { config: any; onChange: (config: any) => void }) {
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
        <p className="text-xs text-gray-400">Se enviará como "Authorization: API-Key {'{tu-key}'}"</p>
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

// API Call Settings
function ApiCallSettings({ config, onChange }: { config: any; onChange: (config: any) => void }) {
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

// Monitor Settings
function MonitorSettings({ config, onChange }: { config: any; onChange: (config: any) => void }) {
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

// Data Transform Settings
function DataTransformSettings({ config, onChange }: { config: any; onChange: (config: any) => void }) {
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


// Helper functions
function getNodeLabel(type: string): string {
  const labels = {
    trigger: 'Manual Trigger',
    apiCall: 'API Call',
    pandadocNode: 'PandaDoc',
    dataTransform: 'Data Transform',
    monitor: 'Monitor',
  };
  return labels[type as keyof typeof labels] || type;
}

function getDefaultNodeConfig(type: string): any {
  const configs = {
    trigger: { 
      name: 'Manual Trigger', 
      inputSchema: {} 
    },
    apiCall: { 
      name: 'API Call', 
      method: 'GET', 
      url: '', 
      headers: {}, 
      body: {},
      connectionId: ''
    },
    pandadocNode: {
      name: 'PandaDoc Document',
      apiKey: '',
      templateId: '',
      documentName: 'Cotización para {{trigger.input.leadName}}'
    },
    dataTransform: { 
      name: 'Data Transform', 
      transformations: []
    },
    monitor: {
      name: 'Debug Monitor',
      displayFields: '',
      outputFormat: 'json',
      enableTimestamp: true
    },
  };
  return configs[type as keyof typeof configs] || {};
}

export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}