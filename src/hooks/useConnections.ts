import { useState, useEffect } from 'react';

export interface Connection {
  id: string;
  name: string;
  type: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  // Note: credentials are never exposed to frontend
}

export interface CreateConnectionData {
  name: string;
  type: string;
  description?: string;
  credentials: Record<string, any>;
}

export interface UseConnectionsReturn {
  connections: Connection[];
  loading: boolean;
  error: string | null;
  createConnection: (connectionData: CreateConnectionData) => Promise<Connection>;
  updateConnection: (connectionId: string, updates: Partial<CreateConnectionData>) => Promise<Connection>;
  deleteConnection: (connectionId: string) => Promise<void>;
  refreshConnections: () => Promise<void>;
}

export function useConnections(): UseConnectionsReturn {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 DEMO MODE: Using mock connections data');
      
      // Mock connections data for demo
      const mockConnections: Connection[] = [];
      setConnections(mockConnections);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(errorMessage);
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async (connectionData: CreateConnectionData): Promise<Connection> => {
    console.log('🔗 DEMO MODE: Simulating connection creation');
    
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      name: connectionData.name,
      type: connectionData.type,
      description: connectionData.description,
      organizationId: 'demo-org',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConnections(prev => [newConnection, ...prev]);
    return newConnection;
  };

  const updateConnection = async (connectionId: string, updates: Partial<CreateConnectionData>): Promise<Connection> => {
    console.log('🔗 DEMO MODE: Simulating connection update');
    
    const existing = connections.find(c => c.id === connectionId)!;
    const updated: Connection = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    setConnections(prev => prev.map(connection => 
      connection.id === connectionId ? updated : connection
    ));
    return updated;
  };

  const deleteConnection = async (connectionId: string): Promise<void> => {
    console.log('🔗 DEMO MODE: Simulating connection deletion');
    setConnections(prev => prev.filter(connection => connection.id !== connectionId));
  };

  const refreshConnections = async () => {
    await fetchConnections();
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    refreshConnections
  };
}