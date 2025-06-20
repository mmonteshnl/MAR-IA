"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import LoadingComponent from '@/components/LoadingComponent';
import LoadingSpinner from '@/components/LoadingSpinner';
import DuplicateDetector from '@/components/leads/DuplicateDetector';
import { 
  ArrowUpCircle,
  Database, 
  RefreshCw, 
  CheckCircle, 
  Users,
  LineChart,
  Target,
  TrendingUp,
  AlertTriangle,
  Facebook,
  FileText,
  Search,
  Upload,
  Plus,
  Filter,
  Eye,
  Send
} from 'lucide-react';
import CsvMappingModal from '@/components/leads/CsvMappingModal';
import { DataSource, DATA_SOURCE_CONFIG, type DataSourceStats, type UnifiedLead } from '@/types/data-sources';

// Enhanced lead sources configuration merging old and new systems
const ENHANCED_LEAD_SOURCES = [
  {
    key: DataSource.META_ADS,
    name: 'Meta Ads',
    icon: <Facebook className="h-4 w-4" />,
    description: 'Leads desde Facebook e Instagram Ads',
    collection: 'meta-lead-ads',
    color: 'bg-blue-900/20 text-blue-300 border-blue-600'
  },
  {
    key: DataSource.FILE_IMPORT,
    name: 'Leads Importados',
    icon: <FileText className="h-4 w-4" />,
    description: 'Leads importados desde archivos CSV',
    collection: 'imported-leads',
    color: 'bg-purple-900/20 text-purple-300 border-purple-600'
  },
  {
    key: DataSource.MANUAL,
    name: 'Leads Manuales',
    icon: <Plus className="h-4 w-4" />,
    description: 'Leads creados manualmente',
    collection: 'manual-leads',
    color: 'bg-gray-800 text-gray-300 border-gray-600'
  },
  {
    key: 'google-places' as any,
    name: 'Buscador de Negocios',
    icon: <Search className="h-4 w-4" />,
    description: 'Leads desde búsquedas de Google Places',
    collection: 'google-places-leads',
    color: 'bg-green-900/20 text-green-300 border-green-600'
  }
] as const;

type SourceKey = DataSource | 'google-places';

const ProspectsHubPage = () => {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SourceKey>(DataSource.META_ADS);
  const [stats, setStats] = useState<DataSourceStats[]>([]);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [transferring, setTransferring] = useState(false);
  
  // CSV Import Modal state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  // Load data source statistics
  const loadStats = useCallback(async () => {
    if (!user || !currentOrganization) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/data-sources/stats?organizationId=${currentOrganization.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error loading stats');

      const data = await response.json();
      setStats(data.stats || []);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, toast]);

  // Load leads from specific source
  const loadSourceLeads = useCallback(async (source: SourceKey) => {
    if (!user || !currentOrganization) return;

    setLoadingLeads(true);
    try {
      const token = await user.getIdToken();
      
      // Handle special case for CSV imports
      const apiSource = source === DataSource.FILE_IMPORT ? 'imported-leads' : source;
      
      const response = await fetch('/api/data-sources/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          source: apiSource
        })
      });

      if (!response.ok) throw new Error('Error loading leads');

      const data = await response.json();
      setLeads(data.leads || []);
      setSelectedLeads([]);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los leads.",
        variant: "destructive"
      });
    } finally {
      setLoadingLeads(false);
    }
  }, [user, currentOrganization, toast]);

  // Transfer selected leads to flow
  const transferToFlow = useCallback(async () => {
    if (!user || !currentOrganization || selectedLeads.length === 0) return;

    setTransferring(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/transfer-to-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          leadIds: selectedLeads,
          sourceType: activeTab
        })
      });

      if (!response.ok) throw new Error('Error transferring leads');

      const data = await response.json();
      
      toast({
        title: "Transferencia completada",
        description: `${data.transferred} leads transferidos al flujo.`
      });

      // Reload data
      await loadStats();
      await loadSourceLeads(activeTab);
      setSelectedLeads([]);

    } catch (error: any) {
      console.error('Error transferring leads:', error);
      toast({
        title: "Error en transferencia",
        description: error.message || "No se pudo completar la transferencia.",
        variant: "destructive"
      });
    } finally {
      setTransferring(false);
    }
  }, [user, currentOrganization, selectedLeads, activeTab, toast, loadStats, loadSourceLeads]);

  // CSV Import handlers
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor seleccione un archivo CSV válido.",
          variant: "destructive"
        });
        return;
      }
      setSelectedCsvFile(file);
      setCsvModalOpen(true);
    }
  };

  const handleCsvImportComplete = (result: { success: boolean; saved: number; total: number; errors?: string[] }) => {
    if (result.success) {
      toast({
        title: "Importación exitosa",
        description: `${result.saved} leads importados correctamente.`
      });
      
      // Reload the imported leads tab
      if (activeTab === DataSource.FILE_IMPORT) {
        loadSourceLeads(DataSource.FILE_IMPORT);
      }
      
      // Update stats
      loadStats();
    }
    
    // Reset file input
    setSelectedCsvFile(null);
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    fileInput?.click();
  };

  // Handle tab change
  const handleTabChange = (source: SourceKey) => {
    setActiveTab(source);
    loadSourceLeads(source);
  };

  // Handle lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => 
      checked 
        ? [...prev, leadId]
        : prev.filter(id => id !== leadId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableLeads = leads.filter(lead => !lead.transferredToFlow).map(lead => lead.id);
      setSelectedLeads(availableLeads);
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle duplicate resolution
  const handleDuplicatesResolved = (remainingLeads: UnifiedLead[]) => {
    setLeads(remainingLeads);
    setSelectedLeads([]);
  };

  // Handle data reload after duplicates are deleted
  const handleReloadData = () => {
    console.log('🔄 DATASOURCES: Reloading data after duplicate deletion');
    loadSourceLeads(activeTab);
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (stats.length > 0) {
      loadSourceLeads(activeTab);
    }
  }, [activeTab, stats.length, loadSourceLeads]);

  if (authLoading || orgLoading || !initialLoadDone) {
    return <LoadingComponent message="Cargando centro de fuentes..." />;
  }

  if (!user && initialLoadDone) {
    return <LoadingComponent message="Redirigiendo al inicio de sesión..." size="small" />;
  }
  
  if (!user || !currentOrganization) {
    return <LoadingComponent message="Cargando organización..." />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentStats = stats.find(s => s.source === activeTab);
  const availableLeads = leads.filter(lead => !lead.transferredToFlow);
  const transferredLeads = leads.filter(lead => lead.transferredToFlow);
  const allSelected = availableLeads.length > 0 && selectedLeads.length === availableLeads.length;
  const someSelected = selectedLeads.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hub de Prospección</h1>
          <p className="text-muted-foreground">
            Gestiona leads de diferentes fuentes y transfiérelos al flujo de trabajo
          </p>
        </div>
        <Button onClick={loadStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const sourceConfig = ENHANCED_LEAD_SOURCES.find(s => s.key === stat.source);
          if (!sourceConfig) return null;
          
          const transferPercentage = stat.total > 0 ? Math.round((stat.transferred / stat.total) * 100) : 0;
          
          return (
            <Card key={stat.source} className={`cursor-pointer transition-all duration-200 ${
              activeTab === stat.source ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => handleTabChange(stat.source)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sourceConfig.icon}
                    <CardTitle className="text-sm">{sourceConfig.name}</CardTitle>
                  </div>
                  <Badge variant={stat.isActive ? "default" : "secondary"} className="text-xs">
                    {stat.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-lg">{stat.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pendientes</p>
                    <p className="font-semibold text-lg text-orange-600">{stat.pending}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Transferidos</span>
                    <span>{stat.transferred}/{stat.total}</span>
                  </div>
                  <Progress value={transferPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {LEAD_SOURCES.map((source) => (
            <TabsTrigger key={source.key} value={source.key} className="flex items-center gap-2">
              {source.icon}
              {source.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEAD_SOURCES.map((source) => (
          <TabsContent key={source.key} value={source.key} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {source.icon}
                      {source.name}
                    </CardTitle>
                    <CardDescription>
                      {source.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* CSV Import button for imported leads tab */}
                    {source.key === 'imported-csv' && (
                      <Button 
                        onClick={triggerFileInput}
                        variant="outline"
                        className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Importar CSV
                      </Button>
                    )}
                    
                    {someSelected && (
                      <>
                        <Badge variant="outline">
                          {selectedLeads.size} seleccionados
                        </Badge>
                        <Button 
                          onClick={promoteSelectedLeads}
                          disabled={promoting}
                          className="bg-primary"
                        >
                          {promoting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Promocionando...
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Promocionar al Flujo
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sourceLeads.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay leads en esta fuente de datos</p>
                      </div>
                    ) : (
                      <>
                        {availableLeads.length > 0 && (
                          <div>
                            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg mb-4">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={handleSelectAll}
                                id="select-all"
                              />
                              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Seleccionar todos los disponibles ({availableLeads.length})
                              </label>
                            </div>

                            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Disponibles para promocionar ({availableLeads.length})
                            </h3>
                            
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Nombre</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Teléfono</TableHead>
                                  <TableHead>Empresa</TableHead>
                                  <TableHead>Creado</TableHead>
                                  <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {availableLeads.map((lead) => (
                                  <TableRow key={lead.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedLeads.has(lead.id)}
                                        onCheckedChange={(checked) => handleLeadSelection(lead.id, !!checked)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {lead.fullName || lead.name || 'Sin nombre'}
                                    </TableCell>
                                    <TableCell>{lead.email || 'N/A'}</TableCell>
                                    <TableCell>{lead.phone || lead.phoneNumber || 'N/A'}</TableCell>
                                    <TableCell>{lead.company || lead.companyName || 'N/A'}</TableCell>
                                    <TableCell>
                                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        onClick={() => promoteLead(lead.id, source.key)}
                                        disabled={promotingLead === lead.id}
                                        className="bg-primary"
                                      >
                                        {promotingLead === lead.id ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                            Promocionando...
                                          </>
                                        ) : (
                                          <>
                                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                                            Promocionar
                                          </>
                                        )}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {promotedLeads.length > 0 && (
                          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                            <h3 className="font-semibold text-green-200 mb-4 flex items-center gap-2 text-base">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              Ya promocionados ({promotedLeads.length})
                            </h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-green-200">Nombre</TableHead>
                                  <TableHead className="text-green-200">Email</TableHead>
                                  <TableHead className="text-green-200">Teléfono</TableHead>
                                  <TableHead className="text-green-200">Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {promotedLeads.map((lead) => (
                                  <TableRow key={lead.id} className="border-green-600/30">
                                    <TableCell className="text-green-100 font-medium">
                                      {lead.fullName || lead.name || 'Sin nombre'}
                                    </TableCell>
                                    <TableCell className="text-green-200">{lead.email || 'N/A'}</TableCell>
                                    <TableCell className="text-green-200">{lead.phone || lead.phoneNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="bg-green-700 text-green-100 border-green-600">
                                        Promocionado
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Hidden file input for CSV upload */}
      <input
        id="csv-file-input"
        type="file"
        accept=".csv"
        onChange={handleCsvFileSelect}
        style={{ display: 'none' }}
      />

      {/* CSV Mapping Modal */}
      <CsvMappingModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        file={selectedCsvFile}
        organizationId={currentOrganization?.id || ''}
        onComplete={handleCsvImportComplete}
      />
    </div>
  );
};

export default ProspectsHubPage;