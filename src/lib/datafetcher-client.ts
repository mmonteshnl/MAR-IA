// Cliente del lado del frontend para interactuar con las APIs de DataFetcher

export interface CollectionInfo {
  id: string;
  name: string;
  description: string;
  requiresOrganization?: boolean;
  fields?: string[];
  path?: string;
}

export interface TestConnectionResult {
  success: boolean;
  sampleData: any[];
  totalCount: number;
  collectionInfo?: CollectionInfo;
  error?: string;
}

export interface CollectionSchema {
  fields: string[];
  sampleValues: Record<string, any>;
  error?: string;
}

export interface FetchDataResult {
  success: boolean;
  data?: any[];
  total?: number;
  hasMore?: boolean;
  metadata?: {
    collection: string;
    executionTime: number;
    filters?: Record<string, any>;
  };
  error?: string;
  timestamp: string;
}

export class DataFetcherClient {
  
  // Obtener colecciones disponibles
  async getAvailableCollections(): Promise<{
    standard: CollectionInfo[];
    organizational: CollectionInfo[];
  }> {
    try {
      const response = await fetch('/api/datafetcher/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting available collections:', error);
      return {
        standard: [],
        organizational: []
      };
    }
  }

  // Probar conexión con una colección
  async testConnection(
    collection: string,
    organizationId?: string,
    userId?: string
  ): Promise<TestConnectionResult> {
    try {
      const response = await fetch('/api/datafetcher/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection,
          organizationId,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        sampleData: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener schema de una colección
  async getCollectionSchema(
    collection: string,
    organizationId?: string,
    userId?: string
  ): Promise<CollectionSchema> {
    try {
      const response = await fetch('/api/datafetcher/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection,
          organizationId,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting collection schema:', error);
      return {
        fields: [],
        sampleValues: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener datos de una colección
  async fetchData(params: {
    collection: string;
    fetchMode?: 'all' | 'byId' | 'byRange';
    targetId?: string;
    organizationId?: string;
    userId?: string;
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: {
      field: string;
      direction: 'asc' | 'desc';
    };
  }): Promise<FetchDataResult> {
    try {
      const response = await fetch('/api/datafetcher/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Instancia singleton
export const dataFetcherClient = new DataFetcherClient();