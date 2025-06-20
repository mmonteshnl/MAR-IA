import { Zap, Link, RefreshCw, Monitor, Globe, UserCheck, Settings, Database, Mail } from 'lucide-react';
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
    type: 'httpRequest', 
    label: 'HTTP Request', 
    icon: Globe, 
    description: 'Peticiones HTTP avanzadas' 
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
  { 
    type: 'leadValidator', 
    label: 'Validador de Leads', 
    icon: UserCheck, 
    description: 'Valida y edita datos de leads' 
  },
  { 
    type: 'logicGate', 
    label: 'Compuerta Lógica', 
    icon: Settings, 
    description: 'Operaciones lógicas entre valores booleanos' 
  },
  { 
    type: 'dataFetcher', 
    label: 'Obtener Datos', 
    icon: Database, 
    description: 'Obtiene datos de la base de datos por ID, rango o todos' 
  },
  { 
    type: 'sendEmail', 
    label: 'Enviar Email', 
    icon: Mail, 
    description: 'Envía correos electrónicos usando Resend' 
  },
];

export const getNodeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    trigger: 'Disparador Manual',
    apiCall: 'Llamada API',
    httpRequest: 'HTTP Request',
    dataTransform: 'Transformar Datos',
    monitor: 'Monitor',
    leadValidator: 'Validador de Leads',
    logicGate: 'Compuerta Lógica',
    dataFetcher: 'Obtener Datos',
    sendEmail: 'Enviar Email',
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
    httpRequest: { 
      name: 'HTTP Request', 
      method: 'GET', 
      url: 'https://api.ejemplo.com/endpoint', 
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: {},
      timeout: 30,
      retries: 1
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
    leadValidator: {
      name: 'Validador de Leads',
      mode: 'validator',
      enableLogging: true,
      logLevel: 'detailed',
      continueOnError: true,
      validatorConfig: {
        conditions: [
          {
            field: 'context',
            operator: '==',
            value: 'premium'
          }
        ],
        outputField: 'isValid',
        trueMessage: 'Validación exitosa',
        falseMessage: 'Validación fallida'
      }
    },
    logicGate: {
      name: 'Compuerta Lógica',
      gateType: 'AND'
    },
    dataFetcher: {
      name: 'Obtener Datos',
      fetchMode: 'all',
      collection: 'leads',
      enableLogging: true,
      includeMetadata: true,
      timeout: 10000
    },
    sendEmail: {
      name: 'Enviar Email',
      from: 'sistema@empresa.com',
      to: '{{team.emails}}',
      subject: 'Notificación desde CONEX',
      bodyTemplate: 'Hola,\n\nEste es un mensaje automático generado por el flujo de CONEX.\n\nSaludos.'
    },
  };
  return configs[type] || {};
};