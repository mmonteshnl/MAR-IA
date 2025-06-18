import { Zap, Link, RefreshCw, Monitor } from 'lucide-react';
import { NodeType } from './index';

export const NODE_TYPES: NodeType[] = [
  { 
    type: 'trigger', 
    label: 'Disparador Manual', 
    icon: Zap, 
    description: 'Inicia el flujo manualmente' 
  },
  { 
    type: 'apiCall', 
    label: 'API Genérica', 
    icon: Link, 
    description: 'Realiza llamadas HTTP' 
  },
  { 
    type: 'dataTransform', 
    label: 'Transformar Datos', 
    icon: RefreshCw, 
    description: 'Transforma información' 
  },
  { 
    type: 'monitor', 
    label: 'Monitor', 
    icon: Monitor, 
    description: 'Debug y visualiza datos' 
  },
];

export const getNodeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    trigger: 'Disparador Manual',
    apiCall: 'Llamada API',
    dataTransform: 'Transformar Datos',
    monitor: 'Monitor',
  };
  return labels[type] || type;
};

export const getDefaultNodeConfig = (type: string): any => {
  const configs: Record<string, any> = {
    trigger: { 
      name: 'Disparador Manual', 
      inputSchema: {} 
    },
    apiCall: { 
      name: 'Llamada API', 
      method: 'GET', 
      url: '', 
      headers: {}, 
      body: {},
      connectionId: ''
    },
    dataTransform: { 
      name: 'Transformar Datos', 
      transformations: []
    },
    monitor: {
      name: 'Monitor de Debug',
      displayFields: '',
      outputFormat: 'json',
      enableTimestamp: true
    },
  };
  return configs[type] || {};
};