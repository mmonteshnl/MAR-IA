import { safeTimestampToDate } from './firestore-utils';

export interface FetchOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: Record<string, any>;
  organizationId?: string;
  userId?: string;
}

export interface DataFetchResult {
  data: any[];
  total: number;
  hasMore: boolean;
  metadata?: {
    collection: string;
    executionTime: number;
    filters?: Record<string, any>;
  };
}

// Colecciones disponibles en el sistema
export const AVAILABLE_COLLECTIONS = [
  {
    id: 'leads',
    name: 'Leads (Legacy)',
    description: 'Sistema legacy de leads',
    requiresOrganization: true,
    fields: ['name', 'email', 'phone', 'status', 'leadValue', 'context']
  },
  {
    id: 'leads-flow',
    name: 'Leads Unificados',
    description: 'Sistema unificado de leads con flujos',
    requiresOrganization: true,
    fields: ['lead', 'automation', 'stageHistory', 'flowStatus', 'priority']
  },
  {
    id: 'generalConfigs',
    name: 'Configuraciones Generales',
    description: 'Configuraciones de usuario',
    requiresOrganization: false,
    fields: ['theme', 'language', 'notifications', 'preferences']
  },
  {
    id: 'valuationConfigs',
    name: 'Configuraciones de Valoración',
    description: 'Reglas de valoración de leads',
    requiresOrganization: true,
    fields: ['rules', 'pricing', 'multipliers', 'categories']
  },
  {
    id: 'userProducts',
    name: 'Productos',
    description: 'Catálogo de productos',
    requiresOrganization: true,
    fields: ['name', 'description', 'price', 'category', 'isActive']
  },
  {
    id: 'userServices',
    name: 'Servicios',
    description: 'Catálogo de servicios',
    requiresOrganization: true,
    fields: ['name', 'description', 'price', 'duration', 'category']
  },
  {
    id: 'trackingLinks',
    name: 'Enlaces de Seguimiento',
    description: 'Enlaces para tracking de conversiones',
    requiresOrganization: true,
    fields: ['url', 'alias', 'clicks', 'conversions', 'isActive']
  },
  {
    id: 'trackingClicks',
    name: 'Clics de Seguimiento',
    description: 'Registro de clics en enlaces',
    requiresOrganization: true,
    fields: ['linkId', 'userAgent', 'ip', 'location', 'timestamp']
  }
] as const;

// Colecciones que requieren estructura organizacional
export const ORGANIZATION_COLLECTIONS = [
  {
    id: 'flows',
    name: 'Flujos de Automatización',
    description: 'Flujos de trabajo automatizados',
    path: 'organizations/{orgId}/flows'
  },
  {
    id: 'whatsapp_instances',
    name: 'Instancias WhatsApp',
    description: 'Configuraciones de WhatsApp',
    path: 'organizations/{orgId}/whatsapp_instances'
  },
  {
    id: 'conversations',
    name: 'Conversaciones',
    description: 'Historial de conversaciones',
    path: 'organizations/{orgId}/conversations'
  }
] as const;

export class FirebaseDataService {
  private db: any;

  constructor() {
    this.db = null;
  }

  private async getFirestore() {
    if (!this.db) {
      // Solo importar firebase-admin del lado del servidor
      if (typeof window === 'undefined') {
        const { db } = await import('./firebase-admin');
        this.db = db;
      } else {
        throw new Error('Firebase Admin no puede ejecutarse en el cliente. Usa las APIs del servidor.');
      }
    }
    return this.db;
  }

  // Obtener todas las colecciones disponibles
  getAvailableCollections() {
    return {
      standard: AVAILABLE_COLLECTIONS,
      organizational: ORGANIZATION_COLLECTIONS
    };
  }

  // Método principal para obtener datos
  async fetchData(
    collection: string,
    options: FetchOptions = {}
  ): Promise<DataFetchResult> {
    const startTime = Date.now();
    const db = await this.getFirestore();

    try {
      // Verificar si es una colección organizacional
      const isOrgCollection = ORGANIZATION_COLLECTIONS.find(c => c.id === collection);
      
      let query;
      if (isOrgCollection && options.organizationId) {
        // Colección dentro de organization
        const collectionPath = isOrgCollection.path.replace('{orgId}', options.organizationId);
        query = db.collection(collectionPath);
      } else {
        // Colección estándar
        query = db.collection(collection);
      }

      // Aplicar filtros obligatorios de forma más eficiente
      if (options.organizationId && !isOrgCollection) {
        const collectionInfo = AVAILABLE_COLLECTIONS.find(c => c.id === collection);
        if (collectionInfo?.requiresOrganization) {
          query = query.where('organizationId', '==', options.organizationId);
        }
      }

      // Solo aplicar filtro de userId si no hay otros filtros complejos para evitar índices múltiples
      if (options.userId && !options.filters && !options.orderBy) {
        query = query.where('uid', '==', options.userId);
      }

      // Aplicar filtros personalizados
      if (options.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object' && value.$gt !== undefined) {
              query = query.where(field, '>', value.$gt);
            } else if (typeof value === 'object' && value.$lt !== undefined) {
              query = query.where(field, '<', value.$lt);
            } else if (typeof value === 'object' && value.$gte !== undefined) {
              query = query.where(field, '>=', value.$gte);
            } else if (typeof value === 'object' && value.$lte !== undefined) {
              query = query.where(field, '<=', value.$lte);
            } else if (typeof value === 'object' && value.$in !== undefined) {
              query = query.where(field, 'in', value.$in);
            } else {
              query = query.where(field, '==', value);
            }
          }
        }
      }

      // Aplicar ordenamiento solo si no hay filtros que requieran índices complejos
      if (options.orderBy) {
        try {
          query = query.orderBy(options.orderBy.field, options.orderBy.direction);
        } catch (error) {
          console.warn('Ordenamiento no aplicado para evitar error de índice:', error);
        }
      } else if (!options.filters && !options.userId) {
        // Ordenamiento por defecto solo si no hay otros filtros complejos
        try {
          query = query.orderBy('updatedAt', 'desc');
        } catch (error) {
          console.warn('Ordenamiento por defecto no aplicado para evitar error de índice:', error);
        }
      }

      // Aplicar paginación
      if (options.offset && options.offset > 0) {
        query = query.offset(options.offset);
      }

      if (options.limit) {
        // Obtener uno más para verificar si hay más datos
        query = query.limit(options.limit + 1);
      } else {
        // Límite por defecto para evitar consultas masivas
        query = query.limit(101); // 100 + 1 para verificar hasMore
      }

      const snapshot = await query.get();
      
      const actualLimit = options.limit || 100;
      const hasMore = snapshot.docs.length > actualLimit;
      
      // Procesar documentos (quitar el extra si existe)
      const docsToProcess = hasMore ? snapshot.docs.slice(0, actualLimit) : snapshot.docs;
      
      const data = docsToProcess.map(doc => {
        const docData = doc.data();
        const processed = { ...docData };
        
        // Convertir timestamps comunes
        const timestampFields = ['createdAt', 'updatedAt', 'lastMessageAt', 'lastActivity', 'timestamp'];
        timestampFields.forEach(field => {
          if (processed[field]) {
            processed[field] = safeTimestampToDate(processed[field]);
          }
        });
        
        return {
          id: doc.id,
          ...processed
        };
      });

      // Obtener conteo total (aproximado)
      let total = data.length;
      if (hasMore) {
        total = (options.offset || 0) + data.length + 1; // Estimación mínima
      }

      const result: DataFetchResult = {
        data,
        total,
        hasMore,
        metadata: {
          collection,
          executionTime: Date.now() - startTime,
          filters: options.filters
        }
      };

      return result;

    } catch (error) {
      console.error('Error fetching data from Firebase:', error);
      throw new Error(`Error obteniendo datos de ${collection}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Obtener un documento específico por ID
  async fetchById(
    collection: string,
    id: string,
    options: FetchOptions = {}
  ): Promise<any | null> {
    const db = await this.getFirestore();

    try {
      // Verificar si es una colección organizacional
      const isOrgCollection = ORGANIZATION_COLLECTIONS.find(c => c.id === collection);
      
      let docRef;
      if (isOrgCollection && options.organizationId) {
        const collectionPath = isOrgCollection.path.replace('{orgId}', options.organizationId);
        docRef = db.collection(collectionPath).doc(id);
      } else {
        docRef = db.collection(collection).doc(id);
      }

      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }

      const docData = doc.data();
      
      // Verificar permisos si es necesario
      const collectionInfo = AVAILABLE_COLLECTIONS.find(c => c.id === collection);
      if (collectionInfo?.requiresOrganization && options.organizationId) {
        if (docData.organizationId !== options.organizationId) {
          return null; // No tiene acceso
        }
      }

      const processed = { ...docData };
      
      // Convertir timestamps comunes
      const timestampFields = ['createdAt', 'updatedAt', 'lastMessageAt', 'lastActivity', 'timestamp'];
      timestampFields.forEach(field => {
        if (processed[field]) {
          processed[field] = safeTimestampToDate(processed[field]);
        }
      });
      
      return {
        id: doc.id,
        ...processed
      };

    } catch (error) {
      console.error('Error fetching document by ID:', error);
      throw new Error(`Error obteniendo documento ${id} de ${collection}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Método para probar conexión y obtener muestra de datos
  async testConnection(
    collection: string,
    options: FetchOptions = {}
  ): Promise<{
    success: boolean;
    sampleData: any[];
    totalCount: number;
    collectionInfo?: any;
    error?: string;
  }> {
    try {
      // Usar consulta simplificada para evitar problemas de índices
      const testOptions = {
        organizationId: options.organizationId,
        limit: 3,
        // No incluir otros filtros para evitar problemas de índices
      };

      const result = await this.fetchData(collection, testOptions);

      const collectionInfo = AVAILABLE_COLLECTIONS.find(c => c.id === collection) ||
                           ORGANIZATION_COLLECTIONS.find(c => c.id === collection);

      return {
        success: true,
        sampleData: result.data,
        totalCount: result.total,
        collectionInfo
      };

    } catch (error) {
      // Si falla la consulta normal, probar consulta básica sin filtros
      try {
        console.warn('Consulta con filtros falló, probando consulta básica:', error);
        const db = await this.getFirestore();
        const basicQuery = await db.collection(collection).limit(3).get();
        
        const basicData = basicQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const collectionInfo = AVAILABLE_COLLECTIONS.find(c => c.id === collection) ||
                             ORGANIZATION_COLLECTIONS.find(c => c.id === collection);

        return {
          success: true,
          sampleData: basicData,
          totalCount: basicData.length,
          collectionInfo,
          // Añadir advertencia sobre la consulta simplificada
          warning: 'Usando consulta básica sin filtros debido a limitaciones de índices'
        };

      } catch (basicError) {
        return {
          success: false,
          sampleData: [],
          totalCount: 0,
          error: basicError instanceof Error ? basicError.message : 'Error desconocido'
        };
      }
    }
  }

  // Método para obtener estructura de campos de una colección
  async getCollectionSchema(
    collection: string,
    options: FetchOptions = {}
  ): Promise<{
    fields: string[];
    sampleValues: Record<string, any>;
  }> {
    try {
      const result = await this.fetchData(collection, {
        ...options,
        limit: 5
      });

      if (result.data.length === 0) {
        const collectionInfo = AVAILABLE_COLLECTIONS.find(c => c.id === collection);
        return {
          fields: collectionInfo?.fields || [],
          sampleValues: {}
        };
      }

      // Extraer todos los campos únicos
      const allFields = new Set<string>();
      const sampleValues: Record<string, any> = {};

      result.data.forEach(doc => {
        Object.keys(doc).forEach(field => {
          allFields.add(field);
          if (!sampleValues[field] && doc[field] !== undefined) {
            sampleValues[field] = doc[field];
          }
        });
      });

      return {
        fields: Array.from(allFields).sort(),
        sampleValues
      };

    } catch (error) {
      console.error('Error getting collection schema:', error);
      return {
        fields: [],
        sampleValues: {}
      };
    }
  }
}

// Instancia singleton
export const firebaseDataService = new FirebaseDataService();