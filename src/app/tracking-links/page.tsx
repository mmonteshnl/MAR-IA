"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ExternalLink, 
  Eye, 
  Copy, 
  TrendingUp, 
  Calendar,
  Link2,
  MousePointer,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrackingLink {
  id: string;
  leadId: string;
  type: 'catalogo' | 'landing' | 'producto' | 'servicio';
  title: string;
  destinationUrl: string;
  trackingUrl: string;
  campaignName: string;
  clickCount: number;
  lastClickAt: string | null;
  createdAt: string;
  isActive: boolean;
  metadata: {
    source?: string;
    leadName?: string;
    businessType?: string;
  };
}

interface TrackingStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  topPerformer: {
    title: string;
    clicks: number;
  } | null;
}

export default function TrackingLinksPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<TrackingLink[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  // Fetch tracking links
  useEffect(() => {
    const fetchTrackingLinks = async () => {
      if (!user || !currentOrganization) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/tracking-links?organizationId=${currentOrganization.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTrackingLinks(data.trackingLinks || []);
          
          // Calcular estadísticas
          const links = data.trackingLinks || [];
          const totalClicks = links.reduce((sum: number, link: TrackingLink) => sum + link.clickCount, 0);
          const activeLinks = links.filter((link: TrackingLink) => link.isActive).length;
          const topPerformer = links.length > 0 
            ? links.reduce((top: TrackingLink, current: TrackingLink) => 
                current.clickCount > top.clickCount ? current : top
              )
            : null;

          setStats({
            totalLinks: links.length,
            totalClicks,
            activeLinks,
            topPerformer: topPerformer ? {
              title: topPerformer.title,
              clicks: topPerformer.clickCount
            } : null
          });
        } else {
          console.error('Error fetching tracking links:', response.statusText);
          toast({
            title: "Error",
            description: "No se pudieron cargar los links de tracking",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching tracking links:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingLinks();
  }, [user, currentOrganization, toast]);

  // Filter links
  useEffect(() => {
    let filtered = trackingLinks;

    if (searchTerm) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.metadata.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(link => link.type === typeFilter);
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(link => link.campaignName === campaignFilter);
    }

    setFilteredLinks(filtered);
  }, [trackingLinks, searchTerm, typeFilter, campaignFilter]);

  const copyToClipboard = async (url: string, title: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado",
        description: `El link "${title}" se ha copiado al portapapeles`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'catalogo': return 'bg-blue-100 text-blue-800';
      case 'landing': return 'bg-green-100 text-green-800';
      case 'producto': return 'bg-purple-100 text-purple-800';
      case 'servicio': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'catalogo': return 'Catálogo';
      case 'landing': return 'Landing Page';
      case 'producto': return 'Producto';
      case 'servicio': return 'Servicio';
      default: return type;
    }
  };

  const availableCampaigns = Array.from(new Set(trackingLinks.map(link => link.campaignName)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-8 w-8 text-primary" />
            Tracking Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y monitorea los links de seguimiento para tus campañas
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear Link
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{stats.totalLinks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Links Activos</p>
                  <p className="text-2xl font-bold">{stats.activeLinks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-bold">
                    {stats.topPerformer ? `${stats.topPerformer.clicks} clicks` : 'N/A'}
                  </p>
                  {stats.topPerformer && (
                    <p className="text-xs text-muted-foreground truncate">
                      {stats.topPerformer.title}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, lead o campaña..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="catalogo">Catálogo</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Campaña" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las campañas</SelectItem>
                {availableCampaigns.map(campaign => (
                  <SelectItem key={campaign} value={campaign}>
                    {campaign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || typeFilter !== 'all' || campaignFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCampaignFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay links de tracking</h3>
              <p className="text-muted-foreground mb-4">
                {trackingLinks.length === 0 
                  ? "Aún no se han creado links de tracking." 
                  : "No hay links que coincidan con los filtros aplicados."}
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{link.title}</h3>
                      <Badge className={getTypeColor(link.type)}>
                        {getTypeLabel(link.type)}
                      </Badge>
                      <Badge variant="outline">
                        {link.campaignName}
                      </Badge>
                      {!link.isActive && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{link.clickCount} clicks</p>
                        <p>Total de clicks</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.metadata.leadName || 'N/A'}
                        </p>
                        <p>Lead asociado</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(new Date(link.createdAt), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p>Creado</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.lastClickAt 
                            ? format(new Date(link.lastClickAt), 'dd MMM yyyy', { locale: es })
                            : 'Nunca'
                          }
                        </p>
                        <p>Último click</p>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 truncate">
                      {link.trackingUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(link.trackingUrl, link.title)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Destino
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}