import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { runDataFetcherNode } from './runner';
import { DataFetcherNodeConfig, DataFetcherContext, DataFetcherResult } from './schema';

/**
 * Hook personalizado para ejecutar el DataFetcherNode con autenticación automática
 */
export function useDataFetcherExecution() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const executeDataFetcher = async (
    config: DataFetcherNodeConfig,
    additionalContext?: Partial<DataFetcherContext>
  ): Promise<DataFetcherResult> => {
    // Crear contexto con datos de autenticación actuales
    const context: DataFetcherContext = {
      variables: {
        organizationId: currentOrganization?.id,
        userId: user?.uid,
        userEmail: user?.email,
        organizationName: currentOrganization?.name,
        ...additionalContext?.variables,
      },
      input: additionalContext?.input,
    };

    // Validar que tenemos los datos necesarios
    if (!user?.uid || !currentOrganization?.id) {
      return {
        success: false,
        error: 'No se pudo obtener información de autenticación o organización',
        timestamp: new Date().toISOString(),
      };
    }

    // Ejecutar el runner con el contexto completo
    return await runDataFetcherNode(config, context);
  };

  const getAuthStatus = () => ({
    isAuthenticated: !!(user?.uid && currentOrganization?.id),
    userId: user?.uid,
    organizationId: currentOrganization?.id,
    userEmail: user?.email,
    organizationName: currentOrganization?.name,
  });

  return {
    executeDataFetcher,
    getAuthStatus,
  };
}