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
  Facebook,
  FileText,
  Search,
  Upload,
  Plus,
  Send,
  QrCode
} from 'lucide-react';
import CsvMappingModal from '@/components/leads/CsvMappingModal';
import { DataSource, DATA_SOURCE_CONFIG, type DataSourceStats, type UnifiedLead } from '@/types/data-sources';
import { EmptyState } from '@/components/ui/empty-state';

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
  },
  {
    key: 'qr-leads' as any,
    name: 'Capturados por QR',
    icon: <QrCode className="h-4 w-4" />,
    description: 'Leads capturados desde códigos QR',
    collection: 'qr-leads',
    color: 'bg-pink-900/20 text-pink-300 border-pink-600'
  }
] as const;

type SourceKey = DataSource | 'google-places' | 'qr-leads';

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
    return <LoadingComponent message="Cargando hub de prospección..." />;
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

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {ENHANCED_LEAD_SOURCES.find(s => s.key === activeTab)?.icon}
                {ENHANCED_LEAD_SOURCES.find(s => s.key === activeTab)?.name}
              </CardTitle>
              <CardDescription>
                {ENHANCED_LEAD_SOURCES.find(s => s.key === activeTab)?.description}
              </CardDescription>
            </div>
            
            {/* Transfer Actions */}
            <div className="flex items-center gap-2">
              {/* CSV Import button for imported leads tab */}
              {activeTab === DataSource.FILE_IMPORT && (
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
                    {selectedLeads.length} seleccionados
                  </Badge>
                  <Button 
                    onClick={transferToFlow}
                    disabled={transferring}
                    className="bg-primary"
                  >
                    {transferring ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Transfiriendo...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Transferir al Flujo
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loadingLeads ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selection Controls */}
              {availableLeads.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Seleccionar todos los disponibles ({availableLeads.length})
                  </label>
                </div>
              )}

              {/* Leads List */}
              <div className="space-y-3">
                {leads.length === 0 ? (
                  <EmptyState
                    icon={Database}
                    title="No hay leads en esta fuente"
                    description={`No se encontraron leads desde ${ENHANCED_LEAD_SOURCES.find(s => s.key === activeTab)?.name}. ${activeTab === DataSource.FILE_IMPORT ? 'Importa un archivo CSV para comenzar.' : activeTab === DataSource.GOOGLE_PLACES ? 'Usa la búsqueda para encontrar negocios locales.' : 'Conecta tu cuenta para sincronizar leads.'}`}
                    action={activeTab === DataSource.FILE_IMPORT ? {
                      label: "Importar CSV",
                      onClick: triggerFileInput
                    } : activeTab === DataSource.GOOGLE_PLACES ? {
                      label: "Buscar Negocios",
                      onClick: () => router.push('/lead-sources/search')
                    } : undefined}
                  />
                ) : (
                  <>
                    {/* Available Leads */}
                    {availableLeads.length > 0 && (
                      <div>
                        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Disponibles para transferir ({availableLeads.length})
                        </h3>
                        <div className="space-y-2">
                          {availableLeads.map((lead) => (
                            <LeadCard 
                              key={lead.id} 
                              lead={lead} 
                              isSelected={selectedLeads.includes(lead.id)}
                              onSelect={handleLeadSelection}
                              showCheckbox={true}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transferred Leads */}
                    {transferredLeads.length > 0 && (
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2 text-base">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          Ya transferidos ({transferredLeads.length})
                        </h3>
                        <div className="space-y-2">
                          {transferredLeads.map((lead) => (
                            <LeadCard 
                              key={lead.id} 
                              lead={lead} 
                              isSelected={false}
                              onSelect={() => {}}
                              showCheckbox={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detector de duplicados */}
      <DuplicateDetector 
        leads={leads}
        onDuplicatesResolved={handleDuplicatesResolved}
        onReloadData={handleReloadData}
      />

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

// Lead card component from data-sources
interface LeadCardProps {
  lead: UnifiedLead;
  isSelected: boolean;
  onSelect: (leadId: string, checked: boolean) => void;
  showCheckbox: boolean;
}

function LeadCard({ lead, isSelected, onSelect, showCheckbox }: LeadCardProps) {
  const sourceConfig = ENHANCED_LEAD_SOURCES.find(s => s.key === lead.source);
  
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg transition-all duration-200 ${
      lead.transferredToFlow 
        ? 'bg-green-900/20 border-green-600' 
        : isSelected 
          ? 'bg-primary/5 border-primary' 
          : 'bg-background border-border hover:border-border/60'
    }`}>
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(lead.id, !!checked)}
          className="mt-1"
        />
      )}
      
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header with name and source */}
        <div className="flex items-center gap-2 mb-2">
          <h4 className={`font-semibold text-base ${
            lead.transferredToFlow ? 'text-gray-200' : 'text-foreground'
          }`}>{lead.name}</h4>
          <Badge variant="outline" className={`${sourceConfig?.color} text-xs`}>
            {sourceConfig?.name}
          </Badge>
        </div>
        
        {/* Lead ID */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            lead.transferredToFlow 
              ? 'text-gray-400 bg-gray-800' 
              : 'text-muted-foreground bg-muted'
          }`}>
            ID: {lead.id}
          </span>
          {lead.createdAt && (
            <span className={`text-xs ${
              lead.transferredToFlow ? 'text-gray-400' : 'text-muted-foreground'
            }`}>
              Creado: {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        
        {/* Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {lead.email && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>📧</span>
              <span className={`truncate ${lead.transferredToFlow ? "text-gray-300" : "text-foreground"}`}>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>📱</span>
              <span className={lead.transferredToFlow ? "text-gray-300" : "text-foreground"}>{lead.phone}</span>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>🏢</span>
              <span className={`truncate ${lead.transferredToFlow ? "text-gray-300" : "text-foreground"}`}>{lead.company}</span>
            </div>
          )}
        </div>
      </div>
      
      {lead.transferredToFlow && (
        <div className="flex items-center gap-1 text-green-400 mt-1">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Transferido</span>
        </div>
      )}
    </div>
  );
}

export default ProspectsHubPage;