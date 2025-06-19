import Handlebars from 'handlebars';
import { decrypt } from './secure-crypto';
import { ConnectionCredentials } from '@/types/conex';

export interface FlowNode {
  id: string;
  type: string;
  data: {
    name: string;
    config: Record<string, any>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ExecutionContext {
  variables: Record<string, any>;
  connections: Record<string, ConnectionCredentials>;
  stepResults: Record<string, any>;
  executionId?: string;
  organizationId?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  startedAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export class FlowExecutor {
  private context: ExecutionContext;

  constructor(organizationId?: string, createdBy?: string, executionId?: string) {
    this.context = {
      variables: {},
      connections: {},
      stepResults: {},
      executionId: executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      status: 'running',
      startedAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };
  }

  // Initialize context with input payload and connections
  async initializeContext(
    inputPayload: Record<string, any>,
    connections: Array<{ id: string; credentials: string; type: string }>
  ): Promise<void> {
    // Set initial variables from input
    this.context.variables = {
      trigger: {
        input: inputPayload
      }
    };

    // Decrypt and store connections
    for (const conn of connections) {
      try {
        const decryptedCreds = JSON.parse(decrypt(conn.credentials));
        this.context.connections[conn.id] = decryptedCreds;
      } catch (error) {
        throw new Error(`Failed to decrypt connection ${conn.id}: ${error}`);
      }
    }
  }

  // Persist execution state to Firestore (Server-side only)
  private async persistExecutionState(): Promise<void> {
    if (!this.context.organizationId || !this.context.executionId) {
      return; // Skip persistence if no organization context
    }

    // Only persist on server-side (when running in Node.js environment)
    if (typeof window !== 'undefined') {
      console.log('💾 Skipping persistence on client-side');
      return;
    }

    try {
      // Dynamic import to avoid bundling Firebase Admin on client
      const { getFirestore } = await import('firebase-admin/firestore');
      await import('@/lib/firebase-admin');
      
      const db = getFirestore();
      const executionRef = db
        .collection('organizations')
        .doc(this.context.organizationId)
        .collection('executions')
        .doc(this.context.executionId);

      this.context.updatedAt = new Date();

      await executionRef.set({
        executionId: this.context.executionId,
        organizationId: this.context.organizationId,
        status: this.context.status,
        currentStep: this.context.currentStep,
        startedAt: this.context.startedAt,
        updatedAt: this.context.updatedAt,
        createdBy: this.context.createdBy,
        stepResults: this.context.stepResults,
        variables: this.context.variables
      }, { merge: true });

      console.log(`💾 Execution state persisted: ${this.context.executionId}`);
    } catch (error) {
      console.error('Failed to persist execution state:', error);
      // Don't throw - execution can continue without persistence
    }
  }

  // Load execution state from Firestore (Server-side only)
  static async loadExecutionState(organizationId: string, executionId: string): Promise<FlowExecutor | null> {
    // Only load on server-side (when running in Node.js environment)
    if (typeof window !== 'undefined') {
      console.log('📂 Skipping state loading on client-side');
      return null;
    }

    try {
      // Dynamic import to avoid bundling Firebase Admin on client
      const { getFirestore } = await import('firebase-admin/firestore');
      await import('@/lib/firebase-admin');
      
      const db = getFirestore();
      const executionDoc = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        return null;
      }

      const data = executionDoc.data()!;
      const executor = new FlowExecutor(organizationId, data.createdBy, executionId);
      
      // Restore context from persisted state
      executor.context = {
        ...executor.context,
        status: data.status,
        currentStep: data.currentStep,
        startedAt: data.startedAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        stepResults: data.stepResults || {},
        variables: data.variables || {}
      };

      console.log(`📂 Execution state loaded: ${executionId}`);
      return executor;
    } catch (error) {
      console.error('Failed to load execution state:', error);
      return null;
    }
  }

  // Execute a complete flow
  async executeFlow(definition: FlowDefinition): Promise<{
    success: boolean;
    results: Record<string, any>;
    error?: string;
    executionId?: string;
  }> {
    try {
      // Persist initial execution state
      await this.persistExecutionState();

      const { nodes, edges } = definition;
      
      // Find trigger node (should be the starting point)
      const triggerNode = nodes.find(node => node.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in flow definition');
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder(nodes, edges);
      const results: Record<string, any> = {};

      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        try {
          // Update current step and persist
          this.context.currentStep = nodeId;
          await this.persistExecutionState();

          const result = await this.executeNode(node);
          results[nodeId] = result;
          this.context.stepResults[nodeId] = result;
          
          // Update context variables with step results
          this.context.variables[`step_${nodeId}`] = result;

          // Persist after each step
          await this.persistExecutionState();
          
        } catch (error) {
          this.context.status = 'failed';
          await this.persistExecutionState();
          
          return {
            success: false,
            results,
            error: `Error in node ${node.data.name}: ${error}`,
            executionId: this.context.executionId
          };
        }
      }

      this.context.status = 'completed';
      await this.persistExecutionState();

      return {
        success: true,
        results,
        executionId: this.context.executionId
      };

    } catch (error) {
      this.context.status = 'failed';
      await this.persistExecutionState();
      
      return {
        success: false,
        results: {},
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionId: this.context.executionId
      };
    }
  }

  // Execute a single node
  private async executeNode(node: FlowNode): Promise<any> {
    switch (node.type) {
      case 'trigger':
        return await this.executeTriggerNode(node);
      
      case 'apiCall':
        return this.executeApiCallNode(node);
      
      case 'httpRequest':
        return this.executeHttpRequestNode(node);
      
      case 'dataTransform':
        return this.executeDataTransformNode(node);
      
      case 'monitor':
        return await this.executeMonitorNode(node);
      
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  // Execute trigger node using modular runner
  private async executeTriggerNode(node: FlowNode): Promise<any> {
    // Importar el runner modular dinámicamente
    const { executeTriggerNode } = await import('../components/conex/nodes/TriggerNode/runner');
    
    // Crear contexto de ejecución
    const context = {
      variables: this.context.variables,
      connections: this.context.connections,
      stepResults: this.context.stepResults,
      renderTemplate: (template: string) => this.renderTemplate(template)
    };
    
    // Opciones del runner
    const options = {
      enableLogs: true,
      executionId: this.context.executionId
    };
    
    // Ejecutar usando el runner modular
    return await executeTriggerNode(node.data.config, context, options);
  }

  // Execute API call node
  private async executeApiCallNode(node: FlowNode): Promise<any> {
    const config = node.data.config;
    const {
      connectionId,
      method = 'GET',
      url,
      headers = {},
      body
    } = config;

    console.log(`🌐 API CALL: ${method.toUpperCase()} ${url}`);
    
    // For testing, allow APIs without connection
    if (!connectionId || connectionId === 'PALCEHOLDER') {
      console.log('🌐 API CALL (Sin conexión configurada) - Ejecutando directamente...');
    }

    // Render templates in URL, headers, and body
    const renderedUrl = this.renderTemplate(url);
    const renderedHeaders = this.renderObjectTemplates(headers);
    const renderedBody = body ? this.renderObjectTemplates(body) : undefined;

    // Add authentication headers based on connection type
    let authHeaders = {};
    
    // Handle internal API calls or testing without connections
    if (connectionId === 'internal-api') {
      // For internal API calls, no connection needed
      // We'll handle authentication differently
    } else if (connectionId && connectionId !== 'PALCEHOLDER') {
      const connection = this.context.connections[connectionId];
      if (connection) {
        authHeaders = this.getAuthHeaders(connection);
      }
    }
    
    const finalHeaders = { ...renderedHeaders, ...authHeaders };

    // Make the API call
    const fetchOptions: RequestInit = {
      method,
      headers: finalHeaders
    };

    if (renderedBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(renderedBody);
      finalHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(renderedUrl, fetchOptions);
    
    console.log(`🌐 API RESPONSE: ${response.status} ${response.statusText}`);
    
    // Para APIs como Pokémon que retornan 404 para entradas inválidas
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      
      // Para el demo de Pokémon, manejar 404 de forma amigable
      if (response.status === 404 && renderedUrl.includes('pokeapi.co')) {
        return {
          error: true,
          status: 404,
          message: `No se encontró un Pokémon con ese nombre. Intenta con nombres como: pikachu, charizard, squirtle, bulbasaur`,
          url: renderedUrl
        };
      }
      
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    try {
      const responseData = await response.json();
      console.log('🌐 API DATA RECEIVED:', Object.keys(responseData).length + ' campos');
      return responseData;
    } catch (error) {
      // Si no es JSON válido, devolver el texto
      const textData = await response.text();
      console.log('🌐 API TEXT RECEIVED:', textData.length + ' caracteres');
      return { text: textData };
    }
  }

  // Execute HTTP request node using modular runner
  private async executeHttpRequestNode(node: FlowNode): Promise<any> {
    // Importar el runner modular dinámicamente
    const { executeHttpRequest } = await import('../components/conex/nodes/HttpRequestNode/runner');
    
    // Crear contexto de ejecución
    const context = {
      variables: this.context.variables,
      connections: this.context.connections,
      stepResults: this.context.stepResults,
      renderTemplate: (template: string) => this.renderTemplate(template)
    };
    
    // Opciones del runner
    const options = {
      enableLogs: true,
      maxRetries: 10,
      baseTimeout: 300
    };
    
    // Ejecutar usando el runner modular
    return await executeHttpRequest(node.data.config, context, options);
  }

  // Execute data transformation node
  private executeDataTransformNode(node: FlowNode): any {
    const config = node.data.config;
    const { transformations } = config;

    let result: any = {};

    // Apply transformations 
    if (transformations && Array.isArray(transformations)) {
      for (const transform of transformations) {
        if (transform.type === 'map') {
          const sourceData = this.resolveVariablePath(transform.source);
          
          if (sourceData) {
            // Create the transformed object
            const transformedData = this.applyMapping(sourceData, transform.mapping);
            
            // Add metadata and analysis for Pokemon data
            if (sourceData.name && sourceData.types) {
              transformedData.analysis = this.generatePokemonAnalysis(sourceData);
              transformedData.leadInsights = this.generateLeadInsights(sourceData);
            }
            
            result[transform.target] = transformedData;
          }
        }
      }
    }

    // Add summary of all available data
    result.summary = {
      triggerData: this.context.variables.trigger,
      allStepResults: Object.keys(this.context.stepResults),
      transformedAt: new Date().toISOString()
    };

    return result;
  }

  // Execute monitor node using modular runner
  private async executeMonitorNode(node: FlowNode): Promise<any> {
    // Importar el runner modular dinámicamente
    const { executeMonitorNode } = await import('../components/conex/nodes/MonitorNode/runner');
    
    // Crear contexto de ejecución
    const context = {
      variables: this.context.variables,
      connections: this.context.connections,
      stepResults: this.context.stepResults,
      renderTemplate: (template: string) => this.renderTemplate(template)
    };
    
    // Opciones del runner
    const options = {
      enableLogs: true
    };
    
    // Ejecutar usando el runner modular
    return await executeMonitorNode(node.data.config, context, options);
  }



  // Render Handlebars template with current context
  private renderTemplate(template: string): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(this.context.variables);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error}`);
    }
  }

  // Render templates in object properties
  private renderObjectTemplates(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.renderTemplate(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.renderObjectTemplates(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  // Get authentication headers based on connection credentials
  private getAuthHeaders(connection: ConnectionCredentials): Record<string, string> {
    const headers: Record<string, string> = {};

    // API Key authentication
    if (connection.apiKey) {
      const headerName = connection.apiKeyHeader || 'Authorization';
      const prefix = connection.apiKeyPrefix || '';
      const value = prefix ? `${prefix} ${connection.apiKey}` : connection.apiKey;
      headers[headerName] = value;
    }
    
    // Bearer Token authentication
    else if (connection.bearerToken) {
      const headerName = connection.tokenHeader || 'Authorization';
      headers[headerName] = `Bearer ${connection.bearerToken}`;
    }
    
    // Basic Authentication
    else if (connection.username && connection.password) {
      const credentials = btoa(`${connection.username}:${connection.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    // Custom Headers
    else if (connection.customHeaders) {
      try {
        // Parse custom headers from string format "Header: Value"
        const headerLines = connection.customHeaders.split('\n');
        for (const line of headerLines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            if (key.trim() && value) {
              headers[key.trim()] = value;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse custom headers:', error);
      }
    }

    return headers;
  }

  // Get execution order using topological sort
  private getExecutionOrder(nodes: FlowNode[], edges: FlowEdge[]): string[] {
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    // Initialize
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      adjList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    Object.keys(inDegree).forEach(nodeId => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Process all neighbors
      adjList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Cycle detected in flow definition');
    }

    return result;
  }

  // Resolve variable path (e.g., "trigger.input.leadName")
  private resolveVariablePath(path: string): any {
    const parts = path.split('.');
    let current = this.context.variables;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Apply data mapping (simplified)
  private applyMapping(sourceData: any, mapping: Record<string, string>): any {
    if (!sourceData || !mapping) return sourceData;

    const result: Record<string, any> = {};
    
    Object.entries(mapping).forEach(([targetKey, sourcePath]) => {
      const value = this.resolveVariablePath(sourcePath);
      if (value !== undefined) {
        result[targetKey] = value;
      }
    });

    return result;
  }

  // Generate Pokemon analysis for demo purposes
  private generatePokemonAnalysis(pokemonData: any): any {
    const types = pokemonData.types?.map((t: any) => t.type?.name || t.name) || [];
    const stats = pokemonData.stats || [];
    const abilities = pokemonData.abilities?.map((a: any) => a.ability?.name || a.name) || [];
    
    // Calculate total stats
    const totalStats = stats.reduce((sum: number, stat: any) => sum + (stat.base_stat || 0), 0);
    const avgStat = stats.length > 0 ? Math.round(totalStats / stats.length) : 0;
    
    return {
      name: pokemonData.name,
      id: pokemonData.id,
      types: types,
      abilities: abilities,
      physicalData: {
        height: pokemonData.height,
        weight: pokemonData.weight,
        heightMeters: pokemonData.height ? (pokemonData.height / 10).toFixed(1) : 'Unknown',
        weightKg: pokemonData.weight ? (pokemonData.weight / 10).toFixed(1) : 'Unknown'
      },
      battleStats: {
        total: totalStats,
        average: avgStat,
        breakdown: stats.map((stat: any) => ({
          name: stat.stat?.name || 'unknown',
          value: stat.base_stat || 0
        }))
      },
      rarity: this.calculateRarity(totalStats, pokemonData.id),
      generation: this.guessGeneration(pokemonData.id)
    };
  }

  // Generate lead insights based on Pokemon characteristics
  private generateLeadInsights(pokemonData: any): any {
    const types = pokemonData.types?.map((t: any) => t.type?.name || t.name) || [];
    const stats = pokemonData.stats || [];
    
    // Find dominant stat
    const dominantStat = stats.reduce((max: any, stat: any) => 
      (stat.base_stat || 0) > (max.base_stat || 0) ? stat : max, stats[0] || {});
    
    return {
      personalityType: this.mapTypesToPersonality(types),
      strengths: this.mapStatsToStrengths(dominantStat),
      businessApproach: this.suggestBusinessApproach(types, dominantStat),
      communicationStyle: this.suggestCommunicationStyle(types),
      recommendedProducts: this.suggestProducts(types, dominantStat),
      leadScore: this.calculateLeadScore(pokemonData),
      notes: `Lead asociado con ${pokemonData.name} - ${types.join('/')} type Pokemon`
    };
  }

  // Helper functions for Pokemon analysis
  private calculateRarity(totalStats: number, id: number): string {
    if (totalStats > 600) return 'Legendary';
    if (totalStats > 500) return 'Rare';
    if (totalStats > 400) return 'Uncommon';
    return 'Common';
  }

  private guessGeneration(id: number): number {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 898) return 8;
    return 9;
  }

  private mapTypesToPersonality(types: string[]): string {
    const typePersonality: Record<string, string> = {
      'fire': 'Enérgico y Apasionado',
      'water': 'Adaptable y Empático',
      'grass': 'Paciente y Sostenible',
      'electric': 'Dinámico e Innovador',
      'psychic': 'Analítico y Estratégico',
      'fighting': 'Determinado y Competitivo',
      'poison': 'Resiliente y Persistente',
      'ground': 'Práctico y Confiable',
      'flying': 'Visionario y Libre',
      'bug': 'Detallista y Trabajador',
      'rock': 'Sólido y Conservador',
      'ghost': 'Misterioso e Independiente',
      'dragon': 'Ambicioso y Poderoso',
      'dark': 'Estratégico y Reservado',
      'steel': 'Metódico y Duradero',
      'fairy': 'Carismático y Optimista'
    };
    
    return types.map(type => typePersonality[type] || 'Único').join(' + ');
  }

  private mapStatsToStrengths(dominantStat: any): string[] {
    const statStrengths: Record<string, string[]> = {
      'hp': ['Resistencia', 'Longevidad', 'Estabilidad'],
      'attack': ['Liderazgo', 'Iniciativa', 'Decisión'],
      'defense': ['Protección', 'Seguridad', 'Confiabilidad'],
      'special-attack': ['Creatividad', 'Innovación', 'Especialización'],
      'special-defense': ['Adaptabilidad', 'Flexibilidad', 'Resiliencia'],
      'speed': ['Agilidad', 'Eficiencia', 'Rapidez de respuesta']
    };
    
    return statStrengths[dominantStat.stat?.name] || ['Equilibrado', 'Versátil'];
  }

  private suggestBusinessApproach(types: string[], dominantStat: any): string {
    if (types.includes('fire') || types.includes('fighting')) {
      return 'Enfoque directo y agresivo - Presentar beneficios inmediatos';
    }
    if (types.includes('psychic') || types.includes('electric')) {
      return 'Enfoque técnico y detallado - Mostrar datos y análisis';
    }
    if (types.includes('water') || types.includes('grass')) {
      return 'Enfoque consultivo y a largo plazo - Construir relación';
    }
    return 'Enfoque equilibrado - Adaptar según respuesta inicial';
  }

  private suggestCommunicationStyle(types: string[]): string {
    if (types.includes('fire') || types.includes('electric')) return 'Comunicación rápida y energética';
    if (types.includes('psychic') || types.includes('ghost')) return 'Comunicación reflexiva y profunda';
    if (types.includes('water') || types.includes('fairy')) return 'Comunicación empática y personal';
    return 'Comunicación profesional y directa';
  }

  private suggestProducts(types: string[], dominantStat: any): string[] {
    const products = [];
    
    if (types.includes('electric') || types.includes('steel')) {
      products.push('Soluciones Tecnológicas Avanzadas', 'Automatización');
    }
    if (types.includes('fire') || types.includes('fighting')) {
      products.push('Soluciones de Alto Rendimiento', 'Optimización de Procesos');
    }
    if (types.includes('water') || types.includes('grass')) {
      products.push('Soluciones Sostenibles', 'Crecimiento a Largo Plazo');
    }
    if (types.includes('psychic')) {
      products.push('Analytics e Inteligencia de Negocio', 'Consultoría Estratégica');
    }
    
    return products.length > 0 ? products : ['Solución Personalizada', 'Consultoría General'];
  }

  private calculateLeadScore(pokemonData: any): number {
    let score = 50; // Base score
    
    const totalStats = pokemonData.stats?.reduce((sum: number, stat: any) => sum + (stat.base_stat || 0), 0) || 0;
    
    // Higher stats = higher potential
    if (totalStats > 500) score += 30;
    else if (totalStats > 400) score += 20;
    else if (totalStats > 300) score += 10;
    
    // Legendary/rare Pokemon = high priority
    if (pokemonData.id && pokemonData.id < 151) score += 10; // Gen 1 bonus
    
    return Math.min(100, Math.max(0, score));
  }
}