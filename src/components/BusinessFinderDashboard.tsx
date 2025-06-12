"use client";

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, LineChart, Users, Target, Clock, TrendingUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp as FirestoreTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

import { BusinessDetailsModal } from "@/components/BusinessDetailsModal";
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';

// Define BusinessDetail if it's not imported from BusinessDetailsModal
interface BusinessDetail {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  international_phone_number?: string;
  website?: string;
  types?: string[];
  rating?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
}

// Define Business if it's different from BusinessDetail or also needed
interface Business extends Partial<BusinessDetail> {
  place_id: string;
  name: string;
  business_status?: string;
}


const LEAD_STAGES_CLIENT = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

type LeadStageClient = typeof LEAD_STAGES_CLIENT[number];

interface LeadClient {
  id: string;
  uid: string;
  name: string;
  address: string | null;
  stage: LeadStageClient;
  createdAt: FirestoreTimestamp | string;
  updatedAt: FirestoreTimestamp | string;
  placeId: string;
  source: string;
  phone?: string | null;
  website?: string | null;
  businessType?: string | null;
}

const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';

export default function BusinessFinderDashboard() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [place, setPlace] = useState('');
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<Business | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [leadsStats, setLeadsStats] = useState({
    total: 0,
    byStage: {} as Record<string, number>,
    conversionRate: 0,
    recentLeads: [] as LeadClient[]
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  const fetchLeadsStats = useCallback(async () => {
    if (!user || !currentOrganization) return;
    
    setStatsLoading(true);
    try {
      // Query meta-lead-ads collection
      let leadsQuery = query(
        collection(db, 'meta-lead-ads'),
        where('organizationId', '==', currentOrganization.id),
        orderBy('updatedAt', 'desc')
      );
      
      let snapshot = await getDocs(leadsQuery);
      
      // If no results, try old leads collection for backward compatibility
      if (snapshot.size === 0) {
        leadsQuery = query(
          collection(db, 'leads'),
          where('organizationId', '==', currentOrganization.id),
          orderBy('updatedAt', 'desc')
        );
        snapshot = await getDocs(leadsQuery);
      }
      
      if (snapshot.size > 0) {
        const leads = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          } as LeadClient;
        });
        
        // Calculate statistics
        const total = leads.length;
        const byStage = leads.reduce((acc: Record<string, number>, lead: LeadClient) => {
          acc[lead.stage] = (acc[lead.stage] || 0) + 1;
          return acc;
        }, {});
        
        const wonLeads = byStage['Ganado'] || 0;
        const conversionRate = total > 0 ? (wonLeads / total) * 100 : 0;
        
        // Get recent leads (last 5)
        const recentLeads = leads.slice(0, 5);
        
        setLeadsStats({
          total,
          byStage,
          conversionRate: Math.round(conversionRate * 10) / 10,
          recentLeads
        });
      }
    } catch (error) {
      console.error('Error fetching leads stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user, currentOrganization]);

  useEffect(() => {
    fetchLeadsStats();
  }, [fetchLeadsStats]);

  const getLocalStorageKey = useCallback(() => {
    return user ? `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${user.uid}` : null;
  }, [user]);

  const handleSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para buscar.", variant: "destructive" });
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    setSelectedBusinessDetail(null);
    setSelectedLeads(new Set());
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      if (country) queryParams.append('country', country);
      if (place) queryParams.append('place', place);
      if (businessTypeInput) queryParams.append('type', businessTypeInput);
      if (keywords) queryParams.append('keywords', keywords);

      const response = await fetch(`/api/findBusinesses?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al buscar negocios. La respuesta del servidor no fue JSON.' }));
        throw new Error(errorData.message || 'Error al buscar negocios.');
      }
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error: any) {
      toast({ title: "Error de Búsqueda", description: error.message, variant: "destructive" });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckboxChange = (placeId: string) => {
    setSelectedLeads(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(placeId)) {
        newSelected.delete(placeId);
      } else {
        newSelected.add(placeId);
      }
      return newSelected;
    });
  };

  const handleShowDetails = async (business: Business) => {
    setSelectedBusinessDetail(business);
    setIsDetailsModalOpen(true);
    setModalDetailsLoading(true);
    try {
      const response = await fetch(`/api/getPlaceDetails?placeId=${business.place_id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar todos los detalles. La respuesta del servidor no fue JSON.' }));
        toast({ title: "Error al Cargar Detalles", description: `${errorData.message || 'Error desconocido'}. Mostrando información básica.`, variant: "destructive" });
        setModalDetailsLoading(false);
        return;
      }
      const data = await response.json();
      const enrichedBusinessData: Business = {
        ...business,
        ...data.result,
        place_id: business.place_id,
        name: data.result.name || business.name,
      };
      setSelectedBusinessDetail(enrichedBusinessData);
      setSearchResults(prevResults =>
        prevResults.map(b => b.place_id === business.place_id ? enrichedBusinessData : b)
      );
    } catch (error: any) {
      toast({ title: "Error al Cargar Detalles", description: error.message, variant: "destructive" });
    } finally {
      setModalDetailsLoading(false);
    }
  };

  const handleAddToLeads = async () => {
    if (!user || !currentOrganization) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para guardar leads.", variant: "destructive" });
      return;
    }
    if (selectedLeads.size === 0) {
      toast({ title: "No Hay Leads Seleccionados", description: "Por favor, selecciona negocios para guardar.", variant: "destructive" });
      return;
    }

    setSaveLoading(true);
    
    // Prepare leads data for the new API
    const leadsDataToSave = searchResults
      .filter(business => selectedLeads.has(business.place_id))
      .map(b => ({
        place_id: b.place_id,
        name: b.name,
        vicinity: b.vicinity,
        formatted_address: b.formatted_address,
        phone: b.international_phone_number,
        website: b.website,
        types: b.types,
        rating: b.rating,
        business_status: b.business_status
      }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/addLeads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leads: leadsDataToSave,
          organizationId: currentOrganization.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar leads');
      }

      const savedCount = result.saved || 0;
      const totalCount = result.total || 0;
      const errors = result.errors || [];

      if (savedCount > 0) {
        toast({ 
          title: "Éxito", 
          description: `¡${savedCount} de ${totalCount} lead(s) guardados correctamente!` 
        });
      }

      if (errors.length > 0) {
        console.warn('Errors during lead saving:', errors);
        toast({ 
          title: "Advertencia", 
          description: `${errors.length} leads tuvieron errores. Revisa la consola para detalles.`,
          variant: "default"
        });
      }

      if (savedCount === 0 && errors.length === 0) {
        toast({ 
          title: "Información", 
          description: "Todos los leads seleccionados ya existían." 
        });
      }

      // Refresh leads stats after successful save
      await fetchLeadsStats();
      
    } catch (error: any) {
      console.error("Error saving leads:", error);
      toast({ 
        title: "Error al Guardar Leads", 
        description: error.message || "Error desconocido al guardar leads",
        variant: "destructive"
      });
    }

    setSelectedLeads(new Set());
    setSaveLoading(false);
  };

  if (authLoading || orgLoading || !initialLoadDone) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user && initialLoadDone) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground mr-2">Redirigiendo al inicio de sesión...</p>
        <LoadingSpinner size="md" />
      </div>
    );
  }
  
  if (!user || !currentOrganization) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col">
      <header 
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg shadow-lg mb-8 flex flex-col sm:flex-row justify-between items-center py-5 px-6"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">Dashboard Principal</h1>
        <Button 
          onClick={() => setIsSearchModalOpen(true)} 
          size="lg" 
          className="bg-white text-indigo-700 hover:bg-indigo-50 mt-4 sm:mt-0 shadow-md flex items-center"
        >
          <Search className="mr-2 h-5 w-5" /> Buscar Nuevos Leads
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white border border-gray-200 text-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Total Leads</h3>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-indigo-700">
              {statsLoading ? '--' : leadsStats.total.toLocaleString()}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {statsLoading ? 'Cargando...' : 'Total de leads en tu base de datos'}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 text-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Leads por Etapa</h3>
            <LineChart className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-4">
            <div className="text-sm space-y-2">
              {statsLoading ? (
                <div className="text-3xl font-extrabold text-indigo-700">--</div>
              ) : (
                Object.entries(leadsStats.byStage).map(([stage, count]) => (
                  <div key={stage} className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">{stage}:</span>
                    <span className="font-semibold text-indigo-700">{count}</span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {statsLoading ? 'Cargando...' : 'Distribución por etapa'}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 text-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Tasa de Conversión</h3>
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-indigo-700">
              {statsLoading ? '--' : `${leadsStats.conversionRate}%`}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {statsLoading ? 'Cargando...' : 'Leads ganados vs total'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-indigo-600" />
            Actividad Reciente
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/leads')}
            className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
          >
            Ver Todos los Leads
          </Button>
        </div>
        {statsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : leadsStats.recentLeads.length > 0 ? (
          <div className="space-y-3">
            {leadsStats.recentLeads.map((lead) => (
              <div key={lead.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-500">{lead.address || 'Sin dirección'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lead.stage === 'Ganado' ? 'bg-green-100 text-green-800' :
                    lead.stage === 'Perdido' ? 'bg-red-100 text-red-800' :
                    lead.stage === 'Negociación' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {lead.stage}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {typeof lead.createdAt === 'string' 
                      ? new Date(lead.createdAt).toLocaleDateString('es-ES') 
                      : 'Fecha no disponible'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No hay leads recientes</p>
            <p className="text-sm mt-1">¡Comienza buscando nuevos leads!</p>
          </div>
        )}
      </div>
    
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col bg-white text-gray-900 border border-gray-300 rounded-xl shadow-lg">
          <DialogHeader className="pb-5 border-b border-gray-300">
            <DialogTitle className="text-2xl flex items-center text-indigo-700 font-semibold"><Search className="mr-2 h-6 w-6 text-indigo-600" /> Buscar Negocios Potenciales</DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">Introduce criterios para encontrar nuevos leads.</DialogDescription>
          </DialogHeader>
          
          {/* Main content area of the modal: scrolls on mobile, child columns scroll on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 py-6 flex-grow overflow-y-auto md:overflow-hidden">
            {/* SearchForm container: takes content height on mobile, full height and scrolls on desktop if needed */}
            <div className="md:col-span-1 space-y-6 pr-0 md:pr-6 md:border-r md:border-gray-300 flex flex-col md:h-full md:overflow-y-auto">
              <SearchForm
                country={country}
                place={place}
                businessTypeInput={businessTypeInput}
                keywords={keywords}
                loading={searchLoading}
                onCountryChange={setCountry}
                onPlaceChange={setPlace}
                onBusinessTypeChange={setBusinessTypeInput}
                onKeywordsChange={setKeywords}
                onSubmit={handleSearch}
              />
            </div>

            {/* SearchResults container: min-height on mobile, full height and scrolls on desktop if needed */}
            <div className="md:col-span-2 flex flex-col min-h-[320px] md:h-full md:overflow-y-auto md:min-h-0">
              <SearchResults
                searchResults={searchResults}
                selectedLeads={selectedLeads}
                hasSearched={hasSearched}
                searchLoading={searchLoading}
                saveLoading={saveLoading}
                onToggleLead={handleCheckboxChange}
                onShowDetails={handleShowDetails}
                onAddToLeads={handleAddToLeads}
              />
            </div>
          </div>
          <DialogFooter className="mt-auto pt-5 border-t border-gray-300">
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-400 text-gray-600 hover:bg-gray-100">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BusinessDetailsModal
        business={selectedBusinessDetail as BusinessDetail | null}
        open={isDetailsModalOpen}
        loading={modalDetailsLoading}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
}
