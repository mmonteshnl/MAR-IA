'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Plus, Trash2, Key, Link, Settings } from 'lucide-react';
import { Connection, CreateConnectionRequest } from '@/types/conex';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateConnectionRequest>({
    name: '',
    type: '',
    authType: 'api_key',
    credentials: {}
  });

  useEffect(() => {
    if (user && organization) {
      fetchConnections();
    }
  }, [user, organization]);

  const createDemoConnection = async () => {
    console.log('🎮 Creating demo connection...');
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'Usuario no autenticado',
        variant: 'destructive'
      });
      return;
    }

    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organización no encontrada',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      console.log('🔑 Getting user token...');
      const token = await user.getIdToken();
      console.log('✅ Token obtained');
      
      const demoConnectionData = {
        name: "PandaDoc API (Demo)",
        type: "PandaDoc API",
        authType: "api_key",
        credentials: {
          apiKey: "demo-api-key-replace-with-real-key",
          apiKeyHeader: "Authorization",
          apiKeyPrefix: "API-Key"
        }
      };

      console.log('📤 Sending request to create connection:', {
        url: '/api/connections',
        method: 'POST',
        organizationId: organization.id,
        data: demoConnectionData
      });

      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(demoConnectionData)
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Response error data:', errorData);
        throw new Error(`Failed to create demo connection: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const newConnection = await response.json();
      console.log('✅ Demo connection created:', newConnection);
      
      setConnections(prev => [newConnection, ...prev]);
      
      toast({
        title: '📄 Demo creado',
        description: 'Conexión demo con PandaDoc API creada exitosamente'
      });
    } catch (error) {
      console.error('💥 Error creating demo connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear la conexión demo',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      setConnections(data.connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    if (!formData.name || !formData.type || !Object.keys(formData.credentials).length) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create connection');
      }

      const newConnection = await response.json();
      setConnections(prev => [newConnection, ...prev]);
      setDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Connection created successfully'
      });
    } catch (error) {
      console.error('Error creating connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to create connection',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete connection');
      }

      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      toast({
        title: 'Success',
        description: 'Connection deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      authType: 'api_key',
      credentials: {}
    });
  };

  const applyConnectionPreset = (connectionType: string) => {
    switch (connectionType) {
      case 'PandaDoc':
        setFormData(prev => ({
          ...prev,
          authType: 'api_key',
          credentials: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'API-Key'
          }
        }));
        break;
      
      case 'ElevenLabs':
        setFormData(prev => ({
          ...prev,
          authType: 'api_key',
          credentials: {
            apiKeyHeader: 'xi-api-key',
            apiKeyPrefix: ''
          }
        }));
        break;
      
      case 'Pokemon API':
        setFormData(prev => ({
          ...prev,
          authType: 'custom_headers',
          credentials: {
            customHeaders: 'Content-Type: application/json'
          }
        }));
        break;
      
      case 'Stripe':
        setFormData(prev => ({
          ...prev,
          authType: 'bearer_token',
          credentials: {
            tokenHeader: 'Authorization'
          }
        }));
        break;
      
      case 'SendGrid':
        setFormData(prev => ({
          ...prev,
          authType: 'bearer_token',
          credentials: {
            tokenHeader: 'Authorization'
          }
        }));
        break;
      
      case 'Slack':
        setFormData(prev => ({
          ...prev,
          authType: 'bearer_token',
          credentials: {
            tokenHeader: 'Authorization'
          }
        }));
        break;
      
      case 'Zapier':
        setFormData(prev => ({
          ...prev,
          authType: 'custom_headers',
          credentials: {}
        }));
        break;
      
      default:
        // No preset changes for generic types
        break;
    }
  };

  const updateCredentials = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  const renderCredentialsForm = () => {
    switch (formData.authType) {
      case 'api_key':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={formData.credentials.apiKey || ''}
                onChange={(e) => updateCredentials('apiKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyHeader">Header Name (opcional)</Label>
              <Input
                id="apiKeyHeader"
                placeholder="e.g., X-API-Key, Authorization, API-Token"
                value={formData.credentials.apiKeyHeader || 'Authorization'}
                onChange={(e) => updateCredentials('apiKeyHeader', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre del header donde se enviará la API key
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyPrefix">Prefijo (opcional)</Label>
              <Input
                id="apiKeyPrefix"
                placeholder="e.g., Bearer, API-Key, Token"
                value={formData.credentials.apiKeyPrefix || ''}
                onChange={(e) => updateCredentials('apiKeyPrefix', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Prefijo antes de la API key (ej: "Bearer api_key_here")
              </p>
            </div>
          </div>
        );
      
      case 'bearer_token':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bearerToken">Bearer Token</Label>
              <Textarea
                id="bearerToken"
                placeholder="Enter your bearer token"
                value={formData.credentials.bearerToken || ''}
                onChange={(e) => updateCredentials('bearerToken', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenHeader">Header Name (opcional)</Label>
              <Input
                id="tokenHeader"
                placeholder="Authorization"
                value={formData.credentials.tokenHeader || 'Authorization'}
                onChange={(e) => updateCredentials('tokenHeader', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'oauth2':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Enter client ID"
                value={formData.credentials.clientId || ''}
                onChange={(e) => updateCredentials('clientId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter client secret"
                value={formData.credentials.clientSecret || ''}
                onChange={(e) => updateCredentials('clientSecret', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenUrl">Token URL</Label>
              <Input
                id="tokenUrl"
                placeholder="https://api.example.com/oauth/token"
                value={formData.credentials.tokenUrl || ''}
                onChange={(e) => updateCredentials('tokenUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Scope (opcional)</Label>
              <Input
                id="scope"
                placeholder="read write admin"
                value={formData.credentials.scope || ''}
                onChange={(e) => updateCredentials('scope', e.target.value)}
              />
            </div>
          </div>
        );

      case 'custom_headers':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headers Personalizados</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Añade headers personalizados para tu API. Uno por línea en formato "Nombre: Valor"
              </p>
              <Textarea
                placeholder="X-API-Key: tu_api_key_aqui&#10;X-Client-ID: tu_client_id&#10;Authorization: Bearer token_aqui&#10;Content-Type: application/json"
                value={formData.credentials.customHeaders || ''}
                onChange={(e) => updateCredentials('customHeaders', e.target.value)}
                rows={6}
              />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ejemplos comunes:</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-muted/50 p-2 rounded font-mono">
                    <span className="text-blue-600">X-API-Key:</span> sk_live_abc123...
                  </div>
                  <div className="bg-muted/50 p-2 rounded font-mono">
                    <span className="text-blue-600">Authorization:</span> Bearer eyJhbGciOiJ...
                  </div>
                  <div className="bg-muted/50 p-2 rounded font-mono">
                    <span className="text-blue-600">X-RapidAPI-Key:</span> your_key_here
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'basic_auth':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={formData.credentials.username || ''}
                onChange={(e) => updateCredentials('username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.credentials.password || ''}
                onChange={(e) => updateCredentials('password', e.target.value)}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pandadoc':
        return <Key className="h-5 w-5" />;
      case 'pokemon api':
        return <span className="text-lg">🎮</span>;
      case 'pandadoc api':
        return <span className="text-lg">📄</span>;
      case 'elevenlabs':
        return <span className="text-lg">🎵</span>;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const getAuthTypeBadge = (authType: string) => {
    const variants = {
      api_key: 'default',
      bearer_token: 'secondary',
      oauth2: 'outline',
      custom_headers: 'destructive',
      basic_auth: 'default'
    } as const;

    const labels = {
      api_key: 'API KEY',
      bearer_token: 'BEARER TOKEN',
      oauth2: 'OAUTH 2.0',
      custom_headers: 'HEADERS CUSTOM',
      basic_auth: 'BASIC AUTH'
    } as const;

    return (
      <Badge variant={variants[authType as keyof typeof variants] || 'default'}>
        {labels[authType as keyof typeof labels] || authType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading connections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Conexiones API</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona conexiones API para tus flujos automatizados. ¿Listo para crear flujos? <a href="/conex/flows" className="text-blue-400 hover:text-blue-300 underline">Ve a Flujos Automatizados</a>
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Connection</DialogTitle>
              <DialogDescription>
                Add a new API connection to use in your flows
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., PandaDoc API"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Connection Type</Label>
                <Select value={formData.type} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, type: value }));
                  // Apply presets based on connection type
                  applyConnectionPreset(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PandaDoc">PandaDoc API</SelectItem>
                    <SelectItem value="ElevenLabs">ElevenLabs API</SelectItem>
                    <SelectItem value="Pokemon API">Pokémon API (Demo)</SelectItem>
                    <SelectItem value="Stripe">Stripe API</SelectItem>
                    <SelectItem value="SendGrid">SendGrid API</SelectItem>
                    <SelectItem value="Slack">Slack API</SelectItem>
                    <SelectItem value="Zapier">Zapier Webhook</SelectItem>
                    <SelectItem value="Generic REST API">Generic REST API</SelectItem>
                    <SelectItem value="Custom Webhook">Custom Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authType">Authentication Type</Label>
                <Select value={formData.authType} onValueChange={(value) => setFormData(prev => ({ ...prev, authType: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key (con headers)</SelectItem>
                    <SelectItem value="bearer_token">Bearer Token</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="custom_headers">Headers Personalizados</SelectItem>
                    <SelectItem value="basic_auth">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {renderCredentialsForm()}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConnection} disabled={creating}>
                {creating ? 'Creating...' : 'Create Connection'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full p-6 mb-6">
              <Settings className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-center">¡Comienza con las Conexiones API!</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
              Crea conexiones API seguras y luego diseña flujos automatizados. 
              Solo 2 pasos: <strong>Conexiones</strong> → <strong>Flujos</strong>.
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primera Conexión
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-blue-600/50 text-blue-300 hover:bg-blue-700/20"
                onClick={createDemoConnection}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                    Creando Demo...
                  </>
                ) : (
                  <>
                    <span className="text-lg mr-2">📄</span>
                    Probar con PandaDoc API
                  </>
                )}
              </Button>
              
              <div className="space-y-3 w-full">
                <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4 w-full">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-900/50 rounded-full p-1 flex-shrink-0">
                      <span className="block w-2 h-2 bg-blue-400 rounded-full"></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200 mb-1">Demo PandaDoc</p>
                      <p className="text-xs text-blue-300 leading-relaxed">
                        Prueba el sistema con PandaDoc API - usa API key de demo
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 w-full">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-900/50 rounded-full p-1 flex-shrink-0">
                      <span className="block w-2 h-2 bg-amber-400 rounded-full"></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-200 mb-1">Para Producción</p>
                      <p className="text-xs text-amber-300 leading-relaxed">
                        Usa tu API key real de PandaDoc para automatizar cotizaciones
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Card key={connection.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getConnectionIcon(connection.type)}
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <CardDescription>{connection.type}</CardDescription>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{connection.name}"? This action cannot be undone and may break existing flows that use this connection.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    {getAuthTypeBadge(connection.authType)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(connection.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}