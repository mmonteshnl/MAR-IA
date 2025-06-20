import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useOrganization } from './useOrganization';

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
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    if (!user || !organization) {
      console.log('❌ Cannot fetch connections - missing auth data');
      setLoading(false);
      setError(null);
      setConnections([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 Fetching connections from Firebase API');
      const token = await user.getIdToken();
      
      const response = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch connections`);
      }

      const data = await response.json();
      setConnections(data.connections || []);
      console.log(`✅ Loaded ${data.connections?.length || 0} connections from Firebase`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(errorMessage);
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async (connectionData: CreateConnectionData): Promise<Connection> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🆕 Creating new connection in Firebase');
      const token = await user.getIdToken();
      
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(connectionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create connection`);
      }

      const newConnection = await response.json();
      setConnections(prev => [newConnection, ...prev]);
      console.log('✅ Connection created successfully:', newConnection.id);
      return newConnection;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  };

  const updateConnection = async (connectionId: string, updates: Partial<CreateConnectionData>): Promise<Connection> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('📝 Updating connection in Firebase:', connectionId);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update connection`);
      }

      const updatedConnection = await response.json();
      setConnections(prev => prev.map(connection => 
        connection.id === connectionId ? updatedConnection : connection
      ));
      console.log('✅ Connection updated successfully:', connectionId);
      return updatedConnection;
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  };

  const deleteConnection = async (connectionId: string): Promise<void> => {
    if (!user || !organization) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🗑️ Deleting connection from Firebase:', connectionId);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete connection`);
      }

      setConnections(prev => prev.filter(connection => connection.id !== connectionId));
      console.log('✅ Connection deleted successfully:', connectionId);
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  };

  const refreshConnections = async () => {
    await fetchConnections();
  };

  useEffect(() => {
    if (user && organization) {
      fetchConnections();
    }
  }, [user?.uid, organization?.id]);

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