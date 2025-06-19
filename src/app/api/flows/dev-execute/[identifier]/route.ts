import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';

interface FlowDefinition {
  nodes: Array<{
    id: string;
    type: string;
    data: {
      name?: string;
      config?: any;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

interface ExecuteFlowOptions {
  inputData: Record<string, any>;
  flowDefinition: FlowDefinition;
  enableLogs?: boolean;
}

// Simulador de ejecución de flujo (similar al useFlowExecutor pero para backend)
async function executeFlowSimulation(options: ExecuteFlowOptions) {
  const { flowDefinition, inputData, enableLogs = true } = options;
  
  if (enableLogs) {
    console.log('🚀 Starting flow execution...');
    console.log('📋 Input data received:', inputData);
    console.log('🔗 Flow nodes:', flowDefinition.nodes.length);
    console.log('⚡ Flow connections:', flowDefinition.edges.length);
  }

  // Asegurar que tenemos datos de entrada válidos
  const finalInputData = Object.keys(inputData || {}).length > 0 
    ? inputData 
    : {
        leadName: 'Demo Lead',
        leadEmail: 'demo@ejemplo.com',
        leadPhone: '+1234567890',
        leadIndustry: 'Tecnología',
        leadValue: 25000,
        leadSource: 'API'
      };
  
  // Simular resultados realistas basados en los nodos del flujo
  const simulatedResults: Record<string, any> = {};
  
  // Primero procesar todos los nodos excepto Monitor
  const nonMonitorNodes = flowDefinition.nodes.filter(node => node.type !== 'monitor');
  const monitorNodes = flowDefinition.nodes.filter(node => node.type === 'monitor');
  
  // Procesar nodos no-monitor primero (de forma secuencial para asegurar orden)
  for (const node of nonMonitorNodes) {
    const nodeId = node.id;
    
    switch (node.type) {
      case 'trigger':
        simulatedResults[nodeId] = {
          success: true,
          input: finalInputData,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'apiCall':
      case 'httpRequest':
        // Para httpRequest, intentar hacer la llamada real
        if (node.type === 'httpRequest' && node.data?.config?.url) {
          try {
            // Hacer la llamada HTTP real
            const url = node.data.config.url;
            const method = node.data.config.method || 'GET';
            const headers = node.data.config.headers || {};
            
            if (enableLogs) {
              console.log(`🌐 Making real HTTP ${method} request to:`, url);
            }
            
            // Hacer la llamada real usando fetch
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...headers
              },
              ...(method !== 'GET' && { body: JSON.stringify(node.data.config.body || {}) })
            });
            
            const responseData = await response.json();
            
            simulatedResults[nodeId] = {
              success: response.ok,
              status: response.status,
              statusText: response.statusText,
              data: responseData,
              headers: Object.fromEntries(response.headers.entries()),
              timestamp: new Date().toISOString(),
              realApiCall: true
            };
            
            if (enableLogs) {
              console.log(`✅ HTTP ${method} request completed:`, {
                status: response.status,
                data: responseData
              });
            }
          } catch (error) {
            if (enableLogs) {
              console.error('❌ HTTP request failed:', error);
            }
            
            simulatedResults[nodeId] = {
              success: false,
              status: 0,
              error: error instanceof Error ? error.message : 'HTTP request failed',
              timestamp: new Date().toISOString(),
              realApiCall: true
            };
          }
        } else {
          // Fallback a simulación para otros casos
          simulatedResults[nodeId] = {
            success: true,
            status: 200,
            data: {
              message: 'API call successful',
              receivedData: finalInputData,
              apiResponse: {
                id: `api_${Date.now()}`,
                status: 'completed',
                result: 'Processed successfully'
              }
            },
            timestamp: new Date().toISOString()
          };
        }
        break;
        
      case 'dataTransform':
        simulatedResults[nodeId] = {
          success: true,
          originalData: finalInputData,
          transformedData: {
            ...finalInputData,
            processed: true,
            transformedAt: new Date().toISOString(),
            industry_category: finalInputData.leadIndustry === 'Tecnología' ? 'Tech' : 'Other',
            value_tier: finalInputData.leadValue > 20000 ? 'High' : 'Standard'
          },
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        simulatedResults[nodeId] = {
          success: true,
          data: finalInputData,
          timestamp: new Date().toISOString()
        };
    }
  }
  
  // Ahora procesar los nodos Monitor con todos los resultados anteriores disponibles
  monitorNodes.forEach((node) => {
    const nodeId = node.id;
    
    // Para el Monitor, simular que captura todos los datos del contexto
    const allPreviousResults = Object.keys(simulatedResults).reduce((acc, key) => {
      acc[`step_${key}`] = simulatedResults[key];
      return acc;
    }, {} as Record<string, any>);
    
    simulatedResults[nodeId] = {
      success: true,
      monitorName: node.data?.config?.name || 'Monitor Debug',
      timestamp: new Date().toISOString(),
      dataSnapshot: {
        trigger: { input: finalInputData },
        stepResults: allPreviousResults,
        currentVariables: {
          trigger: { input: finalInputData },
          ...allPreviousResults
        }
      },
      formattedOutput: JSON.stringify({
        trigger: { input: finalInputData },
        stepResults: allPreviousResults
      }, null, 2),
      consoleLog: {
        title: `🔍 MONITOR: ${node.data?.config?.name || 'Monitor Debug'}`,
        data: {
          trigger: { input: finalInputData },
          stepResults: allPreviousResults
        },
        format: 'json',
        timestamp: new Date().toISOString()
      }
    };
  });
  
  const executionId = `exec_${Date.now()}`;
  
  return {
    success: true,
    results: simulatedResults,
    executionId,
    timestamp: new Date().toISOString(),
    inputData: finalInputData,
    nodesExecuted: flowDefinition.nodes.length
  };
}

// Función helper para generar alias automáticamente
const generateAlias = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
    .replace(/\s+/g, '-')        // Espacios a guiones
    .replace(/-+/g, '-')         // Múltiples guiones a uno
    .replace(/^-|-$/g, '')       // Quitar guiones al inicio/final
    + '-v1';                     // Agregar versión
};

// Función helper para buscar por ID o alias con migración automática
const findFlowByIdentifier = async (db: any, flowIdentifier: string) => {
  // Primero intentar buscar en la colección de flows de desarrollo
  const devFlowRef = db.collection('dev-flows').doc(flowIdentifier);
  const devFlowDoc = await devFlowRef.get();
  
  if (devFlowDoc.exists) {
    const flowData = devFlowDoc.data();
    let updatedFlowData = { id: devFlowDoc.id, ...flowData, source: 'dev-flows' };
    
    // Si el flujo no tiene alias, generar uno automáticamente
    if (!flowData.alias && flowData.name) {
      const autoAlias = generateAlias(flowData.name);
      try {
        await devFlowRef.update({ alias: autoAlias });
        updatedFlowData.alias = autoAlias;
        console.log(`✅ Auto-generated alias "${autoAlias}" for flow ${devFlowDoc.id}`);
      } catch (error) {
        console.warn(`⚠️ Could not auto-generate alias for flow ${devFlowDoc.id}:`, error);
      }
    }
    
    return updatedFlowData;
  }

  // Buscar por alias en dev-flows
  const devFlowsByAlias = await db.collection('dev-flows')
    .where('alias', '==', flowIdentifier)
    .limit(1)
    .get();
  
  if (!devFlowsByAlias.empty) {
    const doc = devFlowsByAlias.docs[0];
    const flowData = doc.data();
    return {
      id: doc.id,
      ...flowData,
      source: 'dev-flows'
    };
  }

  // Si no existe en dev-flows, buscar en organizaciones
  const orgsSnapshot = await db.collection('organizations').get();
  
  for (const orgDoc of orgsSnapshot.docs) {
    // Buscar por ID
    const flowDoc = await db
      .collection('organizations')
      .doc(orgDoc.id)
      .collection('flows')
      .doc(flowIdentifier)
      .get();
    
    if (flowDoc.exists) {
      const flowData = flowDoc.data();
      let updatedFlowData = {
        id: flowDoc.id,
        ...flowData,
        organizationId: orgDoc.id,
        source: 'organization'
      };
      
      // Si el flujo no tiene alias, generar uno automáticamente
      if (!flowData.alias && flowData.name) {
        const autoAlias = generateAlias(flowData.name);
        try {
          await flowDoc.ref.update({ alias: autoAlias });
          updatedFlowData.alias = autoAlias;
          console.log(`✅ Auto-generated alias "${autoAlias}" for org flow ${flowDoc.id}`);
        } catch (error) {
          console.warn(`⚠️ Could not auto-generate alias for org flow ${flowDoc.id}:`, error);
        }
      }
      
      return updatedFlowData;
    }

    // Buscar por alias
    const flowsByAlias = await db
      .collection('organizations')
      .doc(orgDoc.id)
      .collection('flows')
      .where('alias', '==', flowIdentifier)
      .limit(1)
      .get();
    
    if (!flowsByAlias.empty) {
      const doc = flowsByAlias.docs[0];
      const flowData = doc.data();
      return {
        id: doc.id,
        ...flowData,
        organizationId: orgDoc.id,
        source: 'organization'
      };
    }
  }
  
  return null;
};

// GET: Obtener información de un flujo específico (SIN AUTENTICACIÓN)
export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    
    if (!identifier) {
      return NextResponse.json({ 
        error: 'Flow identifier is required',
        usage: 'GET /api/flows/dev-execute/YOUR_FLOW_ID_OR_ALIAS'
      }, { status: 400 });
    }

    console.log(`🔍 Looking for flow with identifier: ${identifier}`);

    // Buscar el flujo en todas las organizaciones (sin autenticación para acceso libre)
    const db = getFirestore();
    const flowResult = await findFlowByIdentifier(db, identifier);
    
    if (flowResult) {
      const { source, ...flowData } = flowResult;
      console.log(`✅ Found flow "${flowData.name}" from source: ${source}`);
      
      return NextResponse.json({
        success: true,
        flow: {
          id: flowData.id,
          name: flowData.name,
          alias: flowData.alias,
          description: flowData.description,
          isEnabled: flowData.isEnabled,
          trigger: flowData.trigger,
          createdAt: flowData.createdAt,
          updatedAt: flowData.updatedAt
        },
        endpoints: {
          execute: `/api/flows/dev-execute/${identifier}`,
          info: `/api/flows/dev-execute/${identifier}`
        },
        usage: {
          get_info: `curl -X GET "http://localhost:3047/api/flows/dev-execute/${identifier}"`,
          execute_flow: `curl -X POST "http://localhost:3047/api/flows/dev-execute/${identifier}" -H "Content-Type: application/json" -d '{"inputData": {"key": "value"}}'`
        }
      });
    }

    return NextResponse.json({ 
      error: 'Flow not found',
      identifier: identifier,
      available_endpoints: [
        'GET /api/flows/dev-execute/{id_or_alias} - Get flow info',
        'POST /api/flows/dev-execute/{id_or_alias} - Execute flow'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('Error fetching flow:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Ejecutar un flujo (SIN AUTENTICACIÓN)
export async function POST(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;
    
    if (!identifier) {
      return NextResponse.json({ 
        error: 'Flow identifier is required',
        usage: 'POST /api/flows/dev-execute/YOUR_FLOW_ID_OR_ALIAS'
      }, { status: 400 });
    }

    console.log(`🚀 Executing flow with identifier: ${identifier}`);

    // Obtener datos del cuerpo de la petición
    let inputData = {};
    try {
      const body = await request.json();
      inputData = body.inputData || body.leadData || body;
    } catch (error) {
      // Si no hay cuerpo JSON válido, usar datos por defecto
      console.log('No valid JSON body provided, using default input data');
    }

    // Buscar el flujo
    const db = getFirestore();
    const flowResult = await findFlowByIdentifier(db, identifier);
    
    if (!flowResult) {
      return NextResponse.json({ 
        error: 'Flow not found',
        identifier: identifier
      }, { status: 404 });
    }

    const flowDefinition = flowResult.definition;
    
    if (!flowDefinition) {
      return NextResponse.json({ 
        error: 'Flow definition not found',
        identifier: identifier,
        flowName: flowResult.name
      }, { status: 400 });
    }

    // Validar estructura del flujo
    if (!flowDefinition.nodes || !Array.isArray(flowDefinition.nodes)) {
      return NextResponse.json({ 
        error: 'Invalid flow definition: nodes array is required'
      }, { status: 400 });
    }

    console.log(`✅ Found flow "${flowResult.name}" with ${flowDefinition.nodes.length} nodes`);
    console.log('📋 Input data:', inputData);
    
    // Ejecutar el flujo
    const result = await executeFlowSimulation({
      flowDefinition,
      inputData,
      enableLogs: true
    });

    return NextResponse.json({
      success: true,
      flowName: flowResult.name,
      flowId: flowResult.id,
      executionId: result.executionId,
      timestamp: result.timestamp,
      inputData: result.inputData,
      nodesExecuted: result.nodesExecuted,
      results: result.results,
      summary: {
        totalNodes: flowDefinition.nodes.length,
        successfulNodes: Object.values(result.results).filter((r: any) => r.success).length,
        failedNodes: Object.values(result.results).filter((r: any) => !r.success).length,
        apiCalls: Object.values(result.results).filter((r: any) => r.realApiCall).length
      }
    });

  } catch (error) {
    console.error('Flow execution error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}