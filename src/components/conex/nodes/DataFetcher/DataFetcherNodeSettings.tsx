import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Database, Info, Eye, EyeOff, Copy, Play, RefreshCw, CheckCircle, AlertCircle, User, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { DataFetcherNodeConfig, DataFetcherNodeConfigSchema, FetchModes } from './schema';
import { DATA_FETCHER_DEFAULTS, EXAMPLE_CONFIGS, HELP_CONTENT } from './constants';
import { 
  getAvailableCollections, 
  testDataFetcherConnection, 
  getCollectionSchema 
} from './runner';

interface DataFetcherNodeSettingsProps {
  config: DataFetcherNodeConfig;
  onChange: (config: DataFetcherNodeConfig) => void;
  onClose?: () => void;
}

interface ValidationError {
  path: string;
  message: string;
}

export function DataFetcherNodeSettings({ config, onChange, onClose }: DataFetcherNodeSettingsProps) {
  // Hooks de autenticación y organización
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  
  const [currentConfig, setCurrentConfig] = useState<DataFetcherNodeConfig>({
    ...DATA_FETCHER_DEFAULTS,
    ...config,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewConfig, setPreviewConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Estados para Firebase integration
  const [availableCollections, setAvailableCollections] = useState<any>({ standard: [], organizational: [] });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [collectionSchema, setCollectionSchema] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Cargar colecciones disponibles al montar el componente
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const collections = await getAvailableCollections();
        setAvailableCollections(collections);
      } catch (error) {
        console.error('Error loading collections:', error);
      }
    };
    
    loadCollections();
  }, []);

  // Función para actualizar configuración y validar
  const updateConfig = (newConfig: DataFetcherNodeConfig) => {
    setCurrentConfig(newConfig);
    
    // Validar configuración usando Zod schema
    try {
      DataFetcherNodeConfigSchema.parse(newConfig);
      setValidationErrors([]);
    } catch (error: any) {
      if (error.errors) {
        setValidationErrors(error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        })));
      }
    }
  };

  // Función para manejar cambios en fields básicos
  const handleBasicChange = (field: string, value: any) => {
    const newConfig = { ...currentConfig, [field]: value };
    updateConfig(newConfig);
  };

  // Aplicar configuración de ejemplo
  const applyExample = (exampleKey: keyof typeof EXAMPLE_CONFIGS) => {
    const example = EXAMPLE_CONFIGS[exampleKey];
    updateConfig({ ...currentConfig, ...example });
    toast({
      title: 'Ejemplo Aplicado',
      description: `Configuración "${example.name}" cargada exitosamente`,
    });
  };

  // Función para obtener los datos de conexión actuales
  const getConnectionData = () => {
    const userId = user?.uid;
    const organizationId = currentOrganization?.id;
    
    return {
      userId,
      organizationId,
      isAuthenticated: !!(userId && organizationId),
      userEmail: user?.email,
      organizationName: currentOrganization?.name
    };
  };

  // Función para probar la conexión
  const testConnection = async () => {
    if (!currentConfig.collection) {
      toast({
        title: 'Error',
        description: 'Selecciona una colección primero',
        variant: 'destructive',
      });
      return;
    }

    const { userId, organizationId, isAuthenticated } = getConnectionData();
    
    if (!isAuthenticated) {
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo obtener información del usuario o organización',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {

      const result = await testDataFetcherConnection(
        currentConfig.collection,
        organizationId,
        userId
      );

      setTestResult(result);

      if (result.success) {
        toast({
          title: 'Conexión Exitosa',
          description: `Encontrados ${result.totalCount} registros en ${currentConfig.collection}`,
        });
      } else {
        toast({
          title: 'Error de Conexión',
          description: result.error || 'No se pudo conectar con la colección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al probar la conexión',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Función para obtener el schema de la colección
  const loadCollectionSchema = async () => {
    if (!currentConfig.collection) return;

    const { userId, organizationId, isAuthenticated } = getConnectionData();
    if (!isAuthenticated) return;

    setLoadingSchema(true);
    try {
      const schema = await getCollectionSchema(
        currentConfig.collection,
        organizationId,
        userId
      );

      setCollectionSchema(schema);
    } catch (error) {
      console.error('Error loading schema:', error);
    } finally {
      setLoadingSchema(false);
    }
  };

  // Cargar schema cuando cambia la colección
  useEffect(() => {
    if (currentConfig.collection) {
      loadCollectionSchema();
    }
  }, [currentConfig.collection]);

  // Función para guardar cambios
  const handleSave = () => {
    if (validationErrors.length === 0) {
      onChange(currentConfig);
      onClose?.();
      toast({
        title: 'Configuración Guardada',
        description: 'Los cambios se han aplicado correctamente',
      });
    }
  };

  // Descripción del modo seleccionado
  const getModeDescription = () => {
    switch (currentConfig.fetchMode) {
      case 'all':
        return 'Obtiene todos los registros de la colección. Ideal para datasets pequeños o cuando necesitas todos los datos.';
      case 'byId':
        return 'Busca un registro específico usando su ID. Perfecto para obtener información detallada de un elemento.';
      case 'byRange':
        return 'Obtiene un rango limitado de registros con paginación. Recomendado para datasets grandes.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-700">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Obtener Datos</h2>
            <p className="text-sm text-gray-400">Configura la obtención de datos desde la base de datos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewConfig(!previewConfig)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {previewConfig ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewConfig ? 'Ocultar' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <Card className="border-red-700 bg-red-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-300">Errores de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-400">
                  <span className="font-medium">{error.path}:</span> {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ejemplos rápidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-200">⚡ Configuraciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => applyExample('getAllLeads')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📊 Todos los Leads
            </Button>
            <Button
              onClick={() => applyExample('getLeadById')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔍 Lead por ID
            </Button>
            <Button
              onClick={() => applyExample('getRecentLeads')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              📄 Leads Recientes
            </Button>
            <Button
              onClick={() => applyExample('getPremiumLeads')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              💎 Leads Premium
            </Button>
            <Button
              onClick={() => applyExample('getProducts')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🛍️ Productos
            </Button>
            <Button
              onClick={() => applyExample('getTrackingLinks')}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔗 Enlaces
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa de configuración */}
      {previewConfig && (
        <Card className="bg-gray-900 border-gray-600">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Vista Previa JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-800 p-3 rounded border border-gray-700 overflow-auto max-h-64 text-gray-300">
              {JSON.stringify(currentConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Configuración principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="basic" className="text-xs">Básico</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Avanzado</TabsTrigger>
          <TabsTrigger value="filters" className="text-xs">Filtros</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Configuración básica */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Configuración Básica</CardTitle>
              <CardDescription className="text-gray-400">Nombre, modo y colección de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 text-xs">Nombre del Nodo</Label>
                  <Input
                    id="name"
                    value={currentConfig.name || ''}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    placeholder="Ej: Obtener Leads Premium"
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collection" className="text-gray-300 text-xs">Colección Firebase</Label>
                  <Select
                    value={currentConfig.collection}
                    onValueChange={(value) => handleBasicChange('collection', value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue placeholder="Selecciona una colección..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {availableCollections.standard.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-gray-400 border-b border-gray-600">
                            Colecciones Estándar
                          </div>
                          {availableCollections.standard.map((collection: any) => (
                            <SelectItem key={collection.id} value={collection.id} className="text-gray-100">
                              <div className="flex flex-col">
                                <span className="font-medium">{collection.name}</span>
                                <span className="text-xs text-gray-400">{collection.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {availableCollections.organizational.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-gray-400 border-b border-gray-600 mt-2">
                            Colecciones Organizacionales
                          </div>
                          {availableCollections.organizational.map((collection: any) => (
                            <SelectItem key={collection.id} value={collection.id} className="text-gray-100">
                              <div className="flex flex-col">
                                <span className="font-medium">{collection.name}</span>
                                <span className="text-xs text-gray-400">{collection.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Estado de conexión actual */}
                  <Card className="mt-4 bg-gray-900 border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-green-400 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Conexión Automática
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const { userId, organizationId, isAuthenticated, userEmail, organizationName } = getConnectionData();
                        
                        if (!isAuthenticated) {
                          return (
                            <div className="p-2 bg-red-900/30 rounded border border-red-700">
                              <p className="text-xs text-red-400">
                                ❌ No se pudo obtener información de autenticación
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-300 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Usuario
                              </Label>
                              <div className="p-2 bg-gray-700 rounded border border-gray-600">
                                <div className="text-xs text-gray-100 font-mono">{userId}</div>
                                <div className="text-xs text-gray-400">{userEmail}</div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-300 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                Organización
                              </Label>
                              <div className="p-2 bg-gray-700 rounded border border-gray-600">
                                <div className="text-xs text-gray-100 font-mono">{organizationId}</div>
                                <div className="text-xs text-gray-400">{organizationName}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Botón de prueba de conexión */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      onClick={testConnection}
                      disabled={!currentConfig.collection || isTestingConnection || !getConnectionData().isAuthenticated}
                      size="sm"
                      variant="outline"
                      className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Probar Conexión
                    </Button>
                    
                    {testResult && (
                      <div className="flex items-center gap-1 text-xs">
                        {testResult.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-green-400">
                              {testResult.totalCount} registros
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-red-400" />
                            <span className="text-red-400">Error</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fetchMode" className="text-gray-300 text-xs">Modo de Obtención</Label>
                <Select
                  value={currentConfig.fetchMode}
                  onValueChange={(value) => handleBasicChange('fetchMode', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all" className="text-gray-100">📊 Todos - Obtener todos los registros</SelectItem>
                    <SelectItem value="byId" className="text-gray-100">🔍 Por ID - Buscar registro específico</SelectItem>
                    <SelectItem value="byRange" className="text-gray-100">📄 Por Rango - Obtener con paginación</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Descripción del modo */}
                <div className="p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">
                      Modo {currentConfig.fetchMode.charAt(0).toUpperCase() + currentConfig.fetchMode.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {getModeDescription()}
                  </p>
                </div>
              </div>

              {/* Configuración específica por modo */}
              {currentConfig.fetchMode === 'byId' && (
                <div className="space-y-2">
                  <Label htmlFor="targetId" className="text-gray-300 text-xs">ID Objetivo</Label>
                  <Input
                    id="targetId"
                    value={currentConfig.targetId || ''}
                    onChange={(e) => handleBasicChange('targetId', e.target.value)}
                    placeholder="Ej: lead-123 o {{leadId}}"
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400">
                    Puedes usar variables como {"{{"} leadId {"}"} para IDs dinámicos
                  </p>
                </div>
              )}

              {currentConfig.fetchMode === 'byRange' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limit" className="text-gray-300 text-xs">Límite</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={currentConfig.rangeConfig?.limit || 10}
                      onChange={(e) => handleBasicChange('rangeConfig', {
                        ...currentConfig.rangeConfig,
                        limit: parseInt(e.target.value)
                      })}
                      min={1}
                      max={1000}
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offset" className="text-gray-300 text-xs">Offset</Label>
                    <Input
                      id="offset"
                      type="number"
                      value={currentConfig.rangeConfig?.offset || 0}
                      onChange={(e) => handleBasicChange('rangeConfig', {
                        ...currentConfig.rangeConfig,
                        offset: parseInt(e.target.value)
                      })}
                      min={0}
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Configuración avanzada */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Configuración Avanzada</CardTitle>
              <CardDescription className="text-gray-400">Opciones de rendimiento y salida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableLogging"
                    checked={currentConfig.enableLogging}
                    onCheckedChange={(checked) => handleBasicChange('enableLogging', checked)}
                  />
                  <Label htmlFor="enableLogging" className="text-sm text-gray-300">Habilitar logs</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeMetadata"
                    checked={currentConfig.includeMetadata}
                    onCheckedChange={(checked) => handleBasicChange('includeMetadata', checked)}
                  />
                  <Label htmlFor="includeMetadata" className="text-sm text-gray-300">Incluir metadata</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-gray-300 text-xs">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={currentConfig.timeout}
                  onChange={(e) => handleBasicChange('timeout', parseInt(e.target.value))}
                  min={1000}
                  max={60000}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          {/* Configuración de filtros */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Filtros de Datos</CardTitle>
              <CardDescription className="text-gray-400">Configura filtros para refinar los resultados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-900/30 border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Configuración de Filtros</span>
                </div>
                <p className="text-sm text-blue-400">
                  Los filtros se pueden configurar dinámicamente a través de las entradas del nodo o de forma estática aquí.
                </p>
              </div>
              
              {/* Schema de la colección */}
              {collectionSchema && (
                <div className="space-y-2">
                  <Label className="text-gray-300 text-xs">Campos Disponibles en {currentConfig.collection}</Label>
                  <div className="p-3 bg-gray-900 rounded border border-gray-600">
                    {loadingSchema ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Cargando schema...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {collectionSchema.fields.map((field: string) => (
                          <span
                            key={field}
                            className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700 cursor-pointer hover:bg-blue-800/50"
                            onClick={() => {
                              // Auto-rellenar filtro con este campo
                              const currentFilters = currentConfig.filters || {};
                              const newFilters = { ...currentFilters, [field]: "" };
                              handleBasicChange('filters', newFilters);
                            }}
                            title={`Clic para agregar filtro por ${field}`}
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="filtersJson" className="text-gray-300 text-xs">Filtros (JSON)</Label>
                <textarea
                  id="filtersJson"
                  value={JSON.stringify(currentConfig.filters || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleBasicChange('filters', parsed);
                    } catch {
                      // Ignorar errores de JSON inválido temporalmente
                    }
                  }}
                  className="w-full p-3 text-sm bg-gray-700 border-gray-600 text-gray-100 rounded font-mono"
                  rows={6}
                  placeholder={`{
  "context": "premium",
  "status": "active",
  "leadValue": { "$gt": 1000 }
}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos de muestra */}
          {testResult && testResult.success && testResult.sampleData.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Datos de Muestra</CardTitle>
                <CardDescription className="text-gray-400">
                  Últimos {testResult.sampleData.length} registros de {currentConfig.collection}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResult.sampleData.map((item: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-900 rounded border border-gray-600">
                      <div className="text-xs font-mono text-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-400">ID:</span>
                          <span>{item.id}</span>
                        </div>
                        <pre className="text-xs overflow-auto max-h-32">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <Button
                    onClick={testConnection}
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={isTestingConnection}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    Actualizar Muestra
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ayuda y documentación */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-gray-300">📚 Ayuda y Documentación</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 space-y-2">
          <div>
            Este nodo obtiene datos de la base de datos usando diferentes modos y filtros.
          </div>
          <div>
            <strong>Modos disponibles:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><code>Todos</code> - Obtiene todos los registros</li>
              <li><code>Por ID</code> - Busca un registro específico</li>
              <li><code>Por Rango</code> - Obtiene registros con paginación</li>
            </ul>
          </div>
          <div>
            <strong>Variables dinámicas:</strong> Usa <code>{"{{variable}}"}</code> para valores dinámicos
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={validationErrors.length > 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}