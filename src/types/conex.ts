// Types for Conex module

export interface Connection {
  id: string;
  name: string;
  type: string;
  authType: 'api_key' | 'bearer_token' | 'oauth2' | 'custom_headers' | 'basic_auth';
  credentials: string; // Encrypted JSON string
  createdAt: Date;
  createdBy: string;
  organizationId: string;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: {
    type: 'manual_lead_action' | 'event' | 'schedule' | 'webhook';
    config: Record<string, any>;
  };
  definition: Record<string, any>; // React Flow definition
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface Execution {
  id: string;
  flowId: string;
  status: 'running' | 'success' | 'failed';
  startedAt: Date;
  finishedAt?: Date;
  triggerType: string;
  inputPayload: Record<string, any>;
  stepsLog: ExecutionStep[];
  error?: {
    message: string;
    stack?: string;
    step?: string;
  };
  organizationId: string;
}

export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: Date;
  finishedAt?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

export interface ConnectionCredentials {
  // API Key authentication
  apiKey?: string;
  apiKeyHeader?: string;
  apiKeyPrefix?: string;
  
  // Bearer Token authentication
  bearerToken?: string;
  tokenHeader?: string;
  
  // OAuth2 authentication
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scope?: string;
  
  // Basic authentication
  username?: string;
  password?: string;
  
  // Custom headers
  customHeaders?: string;
  
  // Generic fallback
  [key: string]: string | number | boolean | undefined;
}

// API Request/Response types
export interface CreateConnectionRequest {
  name: string;
  type: string;
  authType: 'api_key' | 'bearer_token' | 'oauth2' | 'custom_headers' | 'basic_auth';
  credentials: ConnectionCredentials;
}

export interface CreateFlowRequest {
  name: string;
  description: string;
  icon: string;
  trigger: Flow['trigger'];
  definition: Record<string, any>;
  isEnabled?: boolean;
}

export interface RunFlowRequest {
  inputPayload: Record<string, any>;
}