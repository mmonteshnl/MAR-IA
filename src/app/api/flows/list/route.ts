import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Solo para desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode'
      }, { status: 403 });
    }

    const db = getFirestore();
    const flows: any[] = [];

    // Buscar flujos en dev-flows
    try {
      const devFlowsSnapshot = await db.collection('dev-flows').get();
      devFlowsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        flows.push({
          id: doc.id,
          name: data.name || 'Unnamed Flow',
          description: data.description || 'No description',
          type: 'dev',
          isEnabled: data.isEnabled ?? true,
          nodeCount: data.definition?.nodes?.length || 0,
          endpoints: {
            execute: `/api/flows/dev-execute`,
            info: `/api/flows/dev-execute?id=${doc.id}`
          },
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
    } catch (error) {
      console.log('No dev-flows collection found, continuing...');
    }

    // Buscar flujos en organizaciones
    try {
      const orgsSnapshot = await db.collection('organizations').limit(5).get(); // Limitar para evitar sobrecarga
      
      for (const orgDoc of orgsSnapshot.docs) {
        try {
          const flowsSnapshot = await db
            .collection('organizations')
            .doc(orgDoc.id)
            .collection('flows')
            .where('isEnabled', '==', true)
            .limit(10) // Limitar flujos por organización
            .get();
          
          flowsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            flows.push({
              id: doc.id,
              name: data.name || 'Unnamed Flow',
              description: data.description || 'No description',
              type: 'organization',
              organizationId: orgDoc.id,
              isEnabled: data.isEnabled ?? true,
              nodeCount: data.definition?.nodes?.length || 0,
              endpoints: {
                execute: `/api/flows/dev-execute`,
                info: `/api/flows/dev-execute?id=${doc.id}`
              },
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
          });
        } catch (error) {
          console.log(`Error fetching flows for org ${orgDoc.id}:`, error);
        }
      }
    } catch (error) {
      console.log('Error fetching organizations:', error);
    }

    // Ordenar por fecha de creación (más recientes primero)
    flows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      flows,
      total: flows.length,
      devFlows: flows.filter(f => f.type === 'dev').length,
      orgFlows: flows.filter(f => f.type === 'organization').length,
      endpoints: {
        execute: '/api/flows/dev-execute',
        status: '/api/flows/status/{executionId}',
        list: '/api/flows/list'
      },
      examples: {
        executeFlow: {
          method: 'POST',
          url: 'http://localhost:3047/api/flows/dev-execute',
          body: {
            flowId: 'your-flow-id',
            inputData: {
              leadName: 'John Doe',
              leadEmail: 'john@example.com',
              leadValue: 15000
            }
          }
        },
        executeCustomFlow: {
          method: 'POST',
          url: 'http://localhost:3047/api/flows/dev-execute',
          body: {
            flowDefinition: {
              nodes: [
                {
                  id: 'trigger1',
                  type: 'trigger',
                  data: { name: 'Manual Trigger', config: {} }
                },
                {
                  id: 'http1',
                  type: 'httpRequest',
                  data: {
                    name: 'API Call',
                    config: {
                      method: 'GET',
                      url: 'https://jsonplaceholder.typicode.com/posts/1'
                    }
                  }
                },
                {
                  id: 'monitor1',
                  type: 'monitor',
                  data: { name: 'Debug Monitor', config: {} }
                }
              ],
              edges: [
                { id: 'e1', source: 'trigger1', target: 'http1' },
                { id: 'e2', source: 'http1', target: 'monitor1' }
              ]
            },
            inputData: {
              leadName: 'API Test',
              leadEmail: 'test@api.com'
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Error listing flows:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      flows: [],
      total: 0
    }, { status: 500 });
  }
}