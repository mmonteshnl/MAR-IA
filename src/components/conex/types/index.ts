import { Node, Edge } from 'reactflow';

export interface FlowBuilderProps {
  onSave: (flowData: { nodes: Node[]; edges: Edge[] }) => void;
  initialFlowData?: { nodes: Node[]; edges: Edge[] };
  loading?: boolean;
}

export interface NodeSettingsProps {
  node: Node;
  onUpdate: (config: any) => void;
  onClose: () => void;
  onDelete: () => void;
  isOpen?: boolean;
}

export interface NodeConfigProps {
  config: any;
  onChange: (config: any) => void;
}

export interface NodeType {
  type: string;
  label: string;
  icon: any;
  description: string;
}

export interface NodeConfig {
  [key: string]: any;
}