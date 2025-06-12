"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Filter,
  TrendingUp,
  Users,
  Eye,
  Send
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DataSource, DATA_SOURCE_CONFIG, type DataSourceStats, type UnifiedLead } from '@/types/data-sources';

export default function DataSourcesPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DataSource>(DataSource.META_ADS);
  const [stats, setStats] = useState<DataSourceStats[]>([]);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [transferring, setTransferring] = useState(false);

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
  const loadSourceLeads = useCallback(async (source: DataSource) => {
    if (!user || !currentOrganization) return;

    setLoadingLeads(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/data-sources/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          source
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

  // Handle tab change
  const handleTabChange = (source: DataSource) => {
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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (stats.length > 0) {
      loadSourceLeads(activeTab);
    }
  }, [activeTab, stats.length, loadSourceLeads]);

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
          <h1 className="text-3xl font-bold text-foreground">Fuentes de Datos</h1>
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
          const config = DATA_SOURCE_CONFIG[stat.source];
          const transferPercentage = stat.total > 0 ? Math.round((stat.transferred / stat.total) * 100) : 0;
          
          return (
            <Card key={stat.source} className={`cursor-pointer transition-all duration-200 ${
              activeTab === stat.source ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => handleTabChange(stat.source)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <CardTitle className="text-sm">{config.name}</CardTitle>
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
                <span className="text-xl">{DATA_SOURCE_CONFIG[activeTab].icon}</span>
                {DATA_SOURCE_CONFIG[activeTab].name}
              </CardTitle>
              <CardDescription>
                {DATA_SOURCE_CONFIG[activeTab].description}
              </CardDescription>
            </div>
            
            {/* Transfer Actions */}
            {someSelected && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
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
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay leads en esta fuente de datos</p>
                  </div>
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
                      <div>
                        <h3 className="font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
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
    </div>
  );
}

// Lead card component
interface LeadCardProps {
  lead: UnifiedLead;
  isSelected: boolean;
  onSelect: (leadId: string, checked: boolean) => void;
  showCheckbox: boolean;
}

function LeadCard({ lead, isSelected, onSelect, showCheckbox }: LeadCardProps) {
  const config = DATA_SOURCE_CONFIG[lead.source];
  
  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 ${
      lead.transferredToFlow 
        ? 'bg-green-50 border-green-200' 
        : isSelected 
          ? 'bg-primary/5 border-primary' 
          : 'bg-background border-border hover:border-border/60'
    }`}>
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(lead.id, !!checked)}
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-foreground truncate">{lead.name}</h4>
          <Badge variant="outline" className={`${config.color} text-xs`}>
            {config.name}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lead.email && <span>{lead.email}</span>}
          {lead.phone && <span>{lead.phone}</span>}
          {lead.company && <span>{lead.company}</span>}
        </div>
      </div>
      
      {lead.transferredToFlow && (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Transferido</span>
        </div>
      )}
    </div>
  );
}