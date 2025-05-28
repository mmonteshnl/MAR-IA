
"use client";

import { useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription as AlertDescriptionShad } from "@/components/ui/alert";
import LoadingSpinner from '@/components/LoadingSpinner';
import NextImage from 'next/image';
import { LogOut, PlusCircle, ArrowLeft, KanbanSquare, List, Phone, MessageSquareText, Globe, Mail as MailIconLucide, FileText, Lightbulb, Loader2, BrainCircuit, PackageSearch, FileUp, Trash2, ImagePlus, Edit2, Eye, AlertCircle, Zap, MoreVertical, Briefcase, ExternalLink, Search, Dot, Filter, ChevronDown, Users, Clock, Bell, Handshake, Heart, ClipboardList, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, where, orderBy, serverTimestamp, Timestamp as FirestoreTimestamp, writeBatch, addDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import type { Lead, LeadImage, Product as ProductDefinition } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


import { generateWelcomeMessage, type WelcomeMessageInput, type WelcomeMessageOutput } from '@/ai/flows/welcomeMessageFlow';
import { evaluateBusinessFeatures, type EvaluateBusinessInput, type EvaluateBusinessOutput } from '@/ai/flows/evaluateBusinessFlow';
import { generateSalesRecommendations, type SalesRecommendationsInput, type SalesRecommendationsOutput, type Product as AIProduct } from '@/ai/flows/salesRecommendationsFlow';
import { formatXmlLeads, type FormatXmlLeadsInput, type FormatXmlLeadsOutput, type FormattedLead as XmlFormattedLead } from '@/ai/flows/formatXmlLeadsFlow';
import { formatCsvLeads, type FormatCsvLeadsInput, type FormatCsvLeadsOutput, type FormattedLead as CsvFormattedLead } from '@/ai/flows/formatCsvLeadsFlow';

type ImportedFormattedLead = (XmlFormattedLead | CsvFormattedLead) & { suggestedStage?: string };


const LEAD_STAGES = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

type LeadStage = typeof LEAD_STAGES[number];

const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';

type ActionResult = WelcomeMessageOutput | EvaluateBusinessOutput | SalesRecommendationsOutput | { error: string } | null;

const stageColors: Record<LeadStage, string> = {
  Nuevo: 'bg-muted text-muted-foreground',
  Contactado: 'bg-primary/10 text-primary',
  Calificado: 'bg-secondary text-secondary-foreground',
  'Propuesta Enviada': 'bg-primary/20 text-primary',
  Negociación: 'bg-primary/30 text-primary-foreground',
  Ganado: 'bg-primary text-primary-foreground',
  Perdido: 'bg-destructive text-destructive-foreground',
};


console.log("Database instance from firebase.ts:", db);

function formatFirestoreTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof FirestoreTimestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    // Check if it's already an ISO string (or close enough)
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return timestamp;
    }
    // Try to parse it as a date string
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }
  }
  // Fallback for Firestore Timestamp-like objects that aren't instances
  try {
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toISOString();
    }
  } catch (e) {
    // Log error if specific parsing failed, before falling back to current date
    console.warn("Could not parse timestamp, using current date as fallback:", timestamp, e);
  }
  return new Date().toISOString();
}

const isFieldMissing = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined || value.trim() === "") return true;
  const lowerValue = value.toLowerCase();
  return lowerValue === "null" || lowerValue === "string";
};


export default function LeadsPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentActionLead, setCurrentActionLead] = useState<Lead | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult>(null);
  const [isActionResultModalOpen, setIsActionResultModalOpen] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<string | null>(null);

  const [userProducts, setUserProducts] = useState<AIProduct[]>([]);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFileForImport, setSelectedFileForImport] = useState<File | null>(null);
  const [importTargetStage, setImportTargetStage] = useState<LeadStage>("Nuevo");
  const [isImporting, setIsImporting] = useState(false);

  // Lead Details Modal State
  const [isLeadDetailsModalOpen, setIsLeadDetailsModalOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const [isSettingFeaturedImage, setIsSettingFeaturedImage] = useState<string | null>(null);

  // New state for Kanban column modal
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedColumnStage, setSelectedColumnStage] = useState<LeadStage | null>(null);

  // Search/Filter state for Leads page
  const [searchTerm, setSearchTerm] = useState('');

  console.log("LeadsPage mounted. User:", user, "Auth Loading:", authLoading, "Initial Load Done:", initialLoadDone);
  console.log("Current db instance in LeadsPage:", db);


  useEffect(() => {
    if (searchParams.get('action') === 'import-xml') {
      setIsImportModalOpen(true);
      router.replace(pathname, { scroll: false }); 
    }
  }, [searchParams, router, pathname]);


  const getLocalStorageKey = useCallback(() => {
    return user ? `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${user.uid}` : null;
  }, [user]);

  const fetchUserProducts = useCallback(async () => {
    if (!user) return;
    try {
      const productsCollectionRef = collection(db, 'userProducts');
      const q = query(productsCollectionRef, 
        // where("uid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const products: AIProduct[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          name: data.name,
          category: data.category,
          description: data.description || undefined,
          price_usd: data.price_usd,
          original_price_usd: data.original_price_usd || undefined,
        };
      });
      setUserProducts(products);
    } catch (error) {
      console.error("Error fetching user products:", error);
      setUserProducts([]); // Fallback to empty array on error
    }
  }, [user]);


  const fetchLeads = useCallback(async () => {
    if (!user) {
      console.log("fetchLeads: No user, returning.");
      setLoadingLeads(false); // Ensure loading stops if no user
      return;
    }
    setLoadingLeads(true);
    console.log("fetchLeads: Called for user", user.uid);
    const localStorageKey = getLocalStorageKey();
    let combinedLeads: Lead[] = [];

    try {
      const leadsCollectionRef = collection(db, 'leads');
      // const q = query(leadsCollectionRef); // TEMPORARY DEBUG: No filters
      // const q = query(leadsCollectionRef, where("uid", "==", user.uid)); // TEMPORARY DEBUG: No orderBy
      const q = query(leadsCollectionRef, 
        // where("uid", "==", user.uid),
         orderBy("updatedAt", "desc")); // Original query
      
      console.log(`fetchLeads: Firestore query (UID: ${user.uid}, orderBy updatedAt desc) being executed.`);
      const querySnapshot = await getDocs(q);
      
      console.log(`fetchLeads: Firestore query for UID ${user.uid} returned ${querySnapshot.docs.length} documents.`);
      
      // Added console log for all leads with label "leads zzzzz"
      const allLeadsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      console.log("leads zzzzz", allLeadsData);
      
      if (querySnapshot.docs.length > 0) {
        console.log("fetchLeads: First document data:", querySnapshot.docs[0].id, querySnapshot.docs[0].data());
      }

      const serverLeads: Lead[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        try {
            const lead: Lead = {
            id: docSnap.id,
            uid: data.uid,
            placeId: data.placeId || null,
            name: data.name || 'Nombre no disponible',
            address: data.address === "null" ? null : (data.address || null),
            phone: data.phone === "null" ? null : (data.phone || null),
            website: (data.website === "null" || data.website === "string") ? null : (data.website || null),
            email: data.email === "null" ? null : (data.email || null),
            company: data.company === "null" ? null : (data.company || null),
            notes: data.notes === "null" ? null : (data.notes || null),
            businessType: data.businessType === "null" ? null : (data.businessType || null),
            source: data.source || 'Desconocida',
            stage: (data.stage && LEAD_STAGES.includes(data.stage)) ? data.stage as LeadStage : 'Nuevo',
            createdAt: formatFirestoreTimestamp(data.createdAt),
            updatedAt: formatFirestoreTimestamp(data.updatedAt),
            images: data.images || [],
          };
          console.log(`Mapping doc with ID: ${docSnap.id}`, lead);
          return lead;
        } catch (mapError) {
            console.error(`Error mapping document ${docSnap.id}:`, mapError, "Data:", data);
            return null; // Return null for leads that fail mapping
        }
      }).filter(lead => lead !== null) as Lead[]; // Filter out nulls from failed mappings
      console.log(`fetchLeads: Mapped ${serverLeads.length} server leads.`);
      if (serverLeads.length > 0) {
        console.log("fetchLeads: First mapped server lead:", serverLeads[0]);
      }

      let localLeadsFromStorage: Lead[] = [];
      if (localStorageKey) {
        const localDataString = localStorage.getItem(localStorageKey);
        if (localDataString) {
          try {
            localLeadsFromStorage = JSON.parse(localDataString).map((ll: Lead) => ({
              ...ll,
              createdAt: formatFirestoreTimestamp(ll.createdAt),
              updatedAt: formatFirestoreTimestamp(ll.updatedAt),
              address: ll.address === "null" ? null : (ll.address || null),
              phone: ll.phone === "null" ? null : (ll.phone || null),
              website: (ll.website === "null" || ll.website === "string") ? null : (ll.website || null),
              email: ll.email === "null" ? null : (ll.email || null),
              company: ll.company === "null" ? null : (ll.company || null),
              notes: ll.notes === "null" ? null : (ll.notes || null),
              businessType: ll.businessType === "null" ? null : (ll.businessType || null),
            }));
          } catch (parseError) {
            console.error("fetchLeads: Error parsing local leads, ignoring them for now:", parseError);
          }
        }
      }
      console.log(`fetchLeads: Found ${localLeadsFromStorage.length} local leads from storage.`);

      const serverIds = new Set(serverLeads.map(sl => sl.id));
      const uniquePendingLocalLeads = localLeadsFromStorage.filter(
        ll => (ll.source === LOCAL_FALLBACK_SOURCE || (ll.source && ll.source.includes('_import_ia') && ll.placeId === null)) && 
              !serverIds.has(ll.id) 
      );

      console.log(`fetchLeads: Found ${uniquePendingLocalLeads.length} unique pending local leads.`);

      combinedLeads = [...serverLeads, ...uniquePendingLocalLeads];
      console.log(`fetchLeads: Combined leads count: ${combinedLeads.length}.`);

      if (localStorageKey) {
        // Save only the server leads + unique local leads to local storage to prevent accumulation of old local data
        localStorage.setItem(localStorageKey, JSON.stringify(combinedLeads.sort((a, b) => 
          new Date(formatFirestoreTimestamp(b.updatedAt)).getTime() - new Date(formatFirestoreTimestamp(a.updatedAt)).getTime()
        )));
      }
      console.log("fetchLeads: Attempting to set leads state with:", combinedLeads);
      setLeads(combinedLeads.sort((a, b) => 
        new Date(formatFirestoreTimestamp(b.updatedAt)).getTime() - new Date(formatFirestoreTimestamp(a.updatedAt)).getTime()
      ));

      if (combinedLeads.length === 0 && querySnapshot.docs.length > 0) {
          console.warn("fetchLeads: Firestore returned documents, but combinedLeads is empty. Check mapping or filtering logic.");
      }

    } catch (error: any) {
      console.error("fetchLeads: Error fetching or processing leads:", error);
      let descriptionNode: React.ReactNode = `${error.message}. Intentando cargar datos locales.`;
      let duration = 9000;

      if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
        const match = error.message.match(/(https:\/\/[^ )]+)/);
        const indexCreationUrl = match ? match[0] : null;
        
        console.warn(`Firestore query requires an index. Please create it here: ${indexCreationUrl || 'Check Firestore console for index details.'}`);

        descriptionNode = (
          <span className="text-sm">
            La consulta de Firestore requiere un índice. Por favor,{' '}
            {indexCreationUrl ? (
              <a 
                href={indexCreationUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline text-primary hover:text-primary/80 font-semibold"
                onClick={(e) => e.stopPropagation()} // Prevent toast from closing if link is inside
              >
                haz clic aquí para crearlo
              </a>
            ) : (
              'revisa la consola del navegador para el enlace de creación del índice.'
            )}
            Una vez creado (puede tardar unos minutos), intenta de nuevo.
          </span>
        );
        duration = 20000; // Increased duration for this specific toast
      }
      
      toast({ title: "Error de Conexión o Consulta", description: descriptionNode, variant: "destructive", duration });
      
      if (localStorageKey) {
        const localData = localStorage.getItem(localStorageKey);
        if (localData) {
          try {
            const localLeadsParsed: Lead[] = JSON.parse(localData).map((ll: Lead) => ({
              ...ll,
              createdAt: formatFirestoreTimestamp(ll.createdAt),
              updatedAt: formatFirestoreTimestamp(ll.updatedAt),
            }));
            setLeads(localLeadsParsed.sort((a, b) => 
              new Date(formatFirestoreTimestamp(b.updatedAt)).getTime() - new Date(formatFirestoreTimestamp(a.updatedAt)).getTime()
            ));
            toast({ title: "Datos Locales Cargados", description: "Mostrando leads guardados localmente. Podrían no estar actualizados.", variant: "default" });
          } catch (parseError) {
            console.error("fetchLeads: Error parsing local leads from fallback:", parseError);
            toast({ title: "Error al Cargar Datos Locales", description: "No se pudieron interpretar los datos locales.", variant: "destructive" });
            setLeads([]);
          }
        } else {
          toast({ title: "Sin Datos Locales", description: "No se encontraron leads guardados localmente.", variant: "default" });
          setLeads([]);
        }
      } else {
        setLeads([]);
      }
    } finally {
      setLoadingLeads(false);
      console.log("fetchLeads: Finished. LoadingLeads set to false.");
    }
  }, [user, toast, getLocalStorageKey]);


  useEffect(() => {
    if (initialLoadDone && !user && !authLoading) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, authLoading, router]);

  useEffect(() => {
    if (user && initialLoadDone) {
      fetchLeads();
      fetchUserProducts();
    } else if (initialLoadDone && !authLoading && !user) {
      // Clear leads and stop loading if user logs out or no user and auth is done
      setLeads([]);
      setLoadingLeads(false);
      setUserProducts([]);
    }
  }, [user, initialLoadDone, authLoading, fetchLeads, fetchUserProducts]);


  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión para cambiar la etapa.", variant: "destructive" });
      return;
    }
    
    const originalLeads = [...leads]; // For optimistic update rollback
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) return;

    const leadToUpdate = leads[leadIndex];
    // Check if lead is local-only (e.g., from failed server save or direct local import)
    const isLocalOnlyLead = leadToUpdate.id.startsWith('local_') || 
                           (leadToUpdate.source === LOCAL_FALLBACK_SOURCE) ||
                           (leadToUpdate.source.includes('_import_ia') && !leadToUpdate.id.startsWith('local_firebase_id_') && leadToUpdate.placeId === null);


    // Optimistic UI update
    setLeads(prevLeads => {
      const updatedLeads = prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, stage: newStage, updatedAt: new Date().toISOString() } : lead
      );
      // Update local storage as well
      const localStorageKey = getLocalStorageKey();
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedLeads));
      }
      return updatedLeads;
    });

    if (isLocalOnlyLead) {
      toast({ title: "Cambio Local", description: "Etapa del lead actualizada localmente. Se sincronizará cuando sea posible." });
      return; // No server update for local-only leads here
    }

    try {
      const leadDocRef = doc(db, 'leads', leadId);
      await updateDoc(leadDocRef, {
        stage: newStage,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Éxito", description: "Etapa del lead actualizada." });
      // No need to call fetchLeads() here if optimistic update is sufficient and server data matches
    } catch (error: any) {
      // Rollback optimistic update if server fails
      setLeads(originalLeads);
      const localStorageKey = getLocalStorageKey();
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, JSON.stringify(originalLeads));
      }
      toast({ title: "Error de Sincronización", description: `No se pudo actualizar la etapa: ${error.message}`, variant: "destructive" });
    }
  };

  const generateWhatsAppLink = (lead: Lead) => {
    if (isFieldMissing(lead.phone)) return null;
    const cleanPhoneNumber = lead.phone!.replace(/\D/g, '');
    const message = `Hola ${lead.name}, vi tu negocio y estoy interesado/a en tus productos/servicios. ¿Podrías darme más información para considerar una compra? ¡Gracias!`;
    return `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleGenerateWelcomeMessage = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Mensaje de Bienvenida");
    try {
      const input: WelcomeMessageInput = { 
        leadName: lead.name, 
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!
      };
      const result = await generateWelcomeMessage(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar mensaje. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleEvaluateBusiness = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Evaluación de Negocio");
    try {
      const input: EvaluateBusinessInput = {
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        address: isFieldMissing(lead.address) ? undefined : lead.address!,
        website: isFieldMissing(lead.website) ? undefined : lead.website!,
      };
      const result = await evaluateBusinessFeatures(input);
      setActionResult(result);
    } catch (error: any)      {
      setActionResult({ error: error.message || "Error al evaluar negocio. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateSalesRecommendations = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Recomendaciones de Venta");

    // Ensure products are fetched if not already available or if they might be stale
    // This simple check might need refinement based on how often products change
    let currentProducts = userProducts;
    if (currentProducts.length === 0 && user) { // Or add a condition to refetch periodically
        await fetchUserProducts(); // This will update the userProducts state
        // Re-read from state after fetchUserProducts updates it
        // This assumes fetchUserProducts correctly updates the state that userProducts relies on.
        // A more robust way might be to directly use the result of fetchUserProducts if it returned the products.
        // For now, we'll rely on the state being updated.
        // To be absolutely sure, one could re-fetch here synchronously IF fetchUserProducts didn't update state in time for this call.
        // However, that's generally not ideal. We'll assume fetchUserProducts updates `userProducts` state.
        // Let's add a re-fetch from Firestore directly here if userProducts is still empty after the call, as a fallback.
        const productsRef = collection(db, 'userProducts');
        const q = query(productsRef, 
          // where("uid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        currentProducts = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                name: data.name,
                category: data.category,
                description: data.description || undefined,
                price_usd: data.price_usd,
                original_price_usd: data.original_price_usd || undefined,
            };
        });
        setUserProducts(currentProducts); // Ensure state is updated

        if (currentProducts.length === 0) {
             toast({ title: "Catálogo Vacío", description: "No tienes productos en tu catálogo. Usando recomendaciones genéricas.", variant: "default" });
        }
    }

    try {
      const input: SalesRecommendationsInput = {
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        // Pass undefined if currentProducts is empty, so AI uses generic products.
        userProducts: currentProducts.length > 0 ? currentProducts : undefined,
        // Use notes for business evaluation if available and not 'null'
        businessEvaluation: isFieldMissing(lead.notes) ? undefined : lead.notes!,
      };
      const result = await generateSalesRecommendations(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar recomendaciones. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const renderActionButtons = (lead: Lead) => {
  const buttons = [];

  switch (lead.stage) {
    case "Nuevo":
      buttons.push(
        <Button
          key="welcome"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleGenerateWelcomeMessage(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Mensaje de Bienvenida" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <MailIconLucide className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Bienvenida
        </Button>
      );
      // Sugerir estrategias o guiones para el primer contacto
      buttons.push(
        <Button
          key="contactStrategy"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Estrategias de contacto próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <MessageSquareText className="h-3.5 w-3.5 mr-1.5" /> Estrategias de Contacto
        </Button>
      );
      // Recomendar mejores momentos para seguimiento
      buttons.push(
        <Button
          key="bestFollowUpTimes"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Mejores momentos para seguimiento próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" /> Mejores Momentos
        </Button>
      );
      break;

    case "Contactado":
      buttons.push(
        <Button
          key="evaluate"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleEvaluateBusiness(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Evaluación de Negocio" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Evaluar
        </Button>
      );
      buttons.push(
        <Button
          key="recommend"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleGenerateSalesRecommendations(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Recomendaciones de Venta" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Recomendar Productos
        </Button>
      );
      // Generar plantillas personalizadas de correos de seguimiento
      buttons.push(
        <Button
          key="followUpEmail"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Plantillas de seguimiento próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <MailIconLucide className="h-3.5 w-3.5 mr-1.5" /> Seguimiento
        </Button>
      );
      // Sugerir consejos para manejar objeciones
      buttons.push(
        <Button
          key="objectionHandling"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Consejos para objeciones próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Manejo de Objeciones
        </Button>
      );
      break;

    case "Calificado":
      buttons.push(
        <Button
          key="evaluate"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleEvaluateBusiness(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Evaluación de Negocio" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Evaluar
        </Button>
      );
      buttons.push(
        <Button
          key="recommend"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleGenerateSalesRecommendations(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Recomendaciones de Venta" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Recomendar Productos
        </Button>
      );
      // Generar resumen de propuesta o puntos clave de venta
      buttons.push(
        <Button
          key="proposalSummary"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Resumen de propuesta próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" /> Resumen Propuesta
        </Button>
      );
      // Sugerir análisis comparativo con competidores
      buttons.push(
        <Button
          key="competitorAnalysis"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Análisis de competidores próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" /> Análisis Competidores
        </Button>
      );
      break;

    case "Propuesta Enviada":
      buttons.push(
        <Button
          key="recommend"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => handleGenerateSalesRecommendations(lead)}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Recomendaciones de Venta" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Recomendar Productos
        </Button>
      );
      // Generar mensajes recordatorios para seguimiento
      buttons.push(
        <Button
          key="followUpReminder"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Recordatorios de seguimiento próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Bell className="h-3.5 w-3.5 mr-1.5" /> Recordatorio Seguimiento
        </Button>
      );
      // Sugerir tácticas de negociación o concesiones
      buttons.push(
        <Button
          key="negotiationTactics"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Tácticas de negociación próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Handshake className="h-3.5 w-3.5 mr-1.5" /> Tácticas Negociación
        </Button>
      );
      break;

    case "Negociación":
      buttons.push(
        <Button
          key="negotiationStrategy"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Estrategias de negociación próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Handshake className="h-3.5 w-3.5 mr-1.5" /> Estrategia Negociación
        </Button>
      );
      buttons.push(
        <Button
          key="counterOffer"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Mensajes para contraofertas próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" /> Contraoferta
        </Button>
      );
      buttons.push(
        <Button
          key="riskAssessment"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Evaluación de riesgos próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Evaluación Riesgos
        </Button>
      );
      break;

    case "Ganado":
      buttons.push(
        <Button
          key="thankYou"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Mensajes de agradecimiento próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Heart className="h-3.5 w-3.5 mr-1.5" /> Agradecimiento
        </Button>
      );
      buttons.push(
        <Button
          key="crossSell"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Oportunidades de venta cruzada próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <PackageSearch className="h-3.5 w-3.5 mr-1.5" /> Venta Cruzada
        </Button>
      );
      buttons.push(
        <Button
          key="customerSurvey"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Encuestas de satisfacción próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Encuesta Cliente
        </Button>
      );
      break;

    case "Perdido":
      buttons.push(
        <Button
          key="winBack"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Campañas de recuperación próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Repeat className="h-3.5 w-3.5 mr-1.5" /> Recuperación
        </Button>
      );
      buttons.push(
        <Button
          key="lossAnalysis"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Análisis de pérdidas próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Análisis Pérdidas
        </Button>
      );
      buttons.push(
        <Button
          key="competitorReport"
          // variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={() => toast({ title: "Próximamente", description: "Informe de competidores próximamente." })}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" /> Informe Competidores
        </Button>
      );
      break;

    default:
      break;
  }

  return buttons.length > 0 ? (
    <div className="mt-3 pt-2 border-t border-border/30">
      <div className="flex items-center text-xs text-muted-foreground mb-1.5">
        <BrainCircuit className="h-3.5 w-3.5 mr-1.5 text-primary" />
        Acciones Sugeridas con IA:
      </div>
      <div className="flex flex-wrap gap-1">
        {buttons.map((btn) => (
          <div key={btn.key} className="flex-grow shadow-sm w-full roudered-sm">
            {btn}
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

  const handleFileSelectedForImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/xml" || file.name.endsWith(".xml") || file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFileForImport(file);
      } else {
        toast({ title: "Archivo Inválido", description: "Por favor, selecciona un archivo XML o CSV.", variant: "destructive" });
        setSelectedFileForImport(null);
        event.target.value = ""; // Reset file input
      }
    } else {
      setSelectedFileForImport(null);
    }
  };

  const handleImportFile = async () => {
    if (!selectedFileForImport || !user) {
      toast({ title: "Error", description: "Selecciona un archivo e inicia sesión.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    let importedCount = 0;

    try {
      const fileContent = await selectedFileForImport.text();
      let aiResult: FormatXmlLeadsOutput | FormatCsvLeadsOutput;
      let sourceSystem = 'unknown_import_ia';

      if (selectedFileForImport.type === "text/xml" || selectedFileForImport.name.endsWith(".xml")) {
        const aiInput: FormatXmlLeadsInput = { xmlContent: fileContent };
        aiResult = await formatXmlLeads(aiInput);
        sourceSystem = 'xml_import_ia';
      } else if (selectedFileForImport.type === "text/csv" || selectedFileForImport.name.endsWith(".csv")) {
        const aiInput: FormatCsvLeadsInput = { csvContent: fileContent };
        aiResult = await formatCsvLeads(aiInput);
        sourceSystem = 'csv_import_ia';
      } else {
        toast({ title: "Tipo de Archivo No Soportado", description: "Solo se pueden importar archivos XML o CSV.", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      if (!aiResult.leads || aiResult.leads.length === 0) {
        toast({ title: "Sin Leads", description: `La IA no pudo extraer leads del archivo ${selectedFileForImport.name.endsWith(".xml") ? 'XML' : 'CSV'} o el archivo estaba vacío.`, variant: "default" });
        setIsImporting(false);
        setIsImportModalOpen(false);
        setSelectedFileForImport(null);
        return;
      }

      const batch = writeBatch(db);
      const leadsCollectionRef = collection(db, 'leads');
      const newLeadsForLocalStorage: Lead[] = [];

      for (const formattedLead of aiResult.leads as ImportedFormattedLead[]) {
        let stageToSave = importTargetStage;
        if (formattedLead.suggestedStage && LEAD_STAGES.includes(formattedLead.suggestedStage as LeadStage)) {
          stageToSave = formattedLead.suggestedStage as LeadStage;
        }
        
        // Prepare data for Firestore, converting "null" strings to actual null
        const newLeadDataForFirestore: Omit<Lead, 'id' | 'images' | 'createdAt' | 'updatedAt'> & { images?: LeadImage[]; createdAt: any; updatedAt: any;} = {
          uid: user.uid,
          name: formattedLead.name, // Name is mandatory based on IA flow
          email: formattedLead.email === "null" ? null : formattedLead.email,
          phone: formattedLead.phone === "null" || formattedLead.phone === undefined ? null : formattedLead.phone,
          address: formattedLead.address === "null" || formattedLead.address === undefined ? null : formattedLead.address,
          company: formattedLead.company === "null" ? null : formattedLead.company,
          website: (formattedLead.website === "null" || formattedLead.website === "string" || typeof formattedLead.website === "undefined") ? null : formattedLead.website,
          businessType: formattedLead.businessType === "null" ? null : formattedLead.businessType,
          notes: formattedLead.notes === "null" ? null : formattedLead.notes,
          placeId: null, // XML/CSV imports don't have placeId
          source: sourceSystem,
          stage: stageToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          images: [], // Initialize with empty images array
        };
        const newLeadRef = doc(leadsCollectionRef); // Auto-generate ID
        batch.set(newLeadRef, newLeadDataForFirestore);
        importedCount++;

        // Prepare data for optimistic local storage update (with string dates for now)
        newLeadsForLocalStorage.push({
          ...newLeadDataForFirestore,
          id: newLeadRef.id, // Use the generated ID
          createdAt: new Date().toISOString(), // Placeholder, Firestore will set actual
          updatedAt: new Date().toISOString(), // Placeholder
          images: [],
        });
      }

      await batch.commit();
      toast({ title: "Éxito", description: `${importedCount} lead(s) importados y formateados correctamente desde ${selectedFileForImport.name.endsWith(".xml") ? 'XML' : 'CSV'}.` });
      
      // Optimistically add to local state and local storage
      const localStorageKey = getLocalStorageKey();
      if (localStorageKey) {
        const currentLocalLeads = leads; // Current state before adding new ones
        const combinedForStorage = [...newLeadsForLocalStorage, ...currentLocalLeads].sort(
          (a, b) =>
            new Date(formatFirestoreTimestamp(b.updatedAt)).getTime() -
            new Date(formatFirestoreTimestamp(a.updatedAt)).getTime()
        );
        localStorage.setItem(localStorageKey, JSON.stringify(combinedForStorage));
        setLeads(combinedForStorage); // Update state
      } else {
        fetchLeads(); // Fallback to refetch if no local storage key
      }
      
    } catch (error: any) {
      console.error(`Error importing ${selectedFileForImport.name.endsWith(".xml") ? 'XML' : 'CSV'} leads:`, error);
      toast({ title: "Error de Importación", description: error.message || "No se pudieron importar los leads.", variant: "destructive" });
    } finally {
      setIsImporting(false);
      setIsImportModalOpen(false);
      setSelectedFileForImport(null);
    }
  };

  const handleOpenLeadDetailsModal = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsLeadDetailsModalOpen(true);
  };

  const handleImageUploadSuccessForLead = async (leadId: string, uploadResult: { public_id: string; secure_url: string }) => {
    if (!user || !selectedLeadForDetails) return;
    
    const newImage: LeadImage = {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      is_featured: !(selectedLeadForDetails.images && selectedLeadForDetails.images.some(img => img.is_featured)),
      uploaded_at: new Date().toISOString(), // Use ISO string for client-side
    };

    // Optimistic update for the modal
    const updatedLead = { ...selectedLeadForDetails };
    updatedLead.images = [...(updatedLead.images || [])];
    
    // If this is the first image or no other image is featured, make this one featured.
    if (newImage.is_featured) {
      updatedLead.images.forEach(img => img.is_featured = false);
    }
    updatedLead.images.push(newImage);
    updatedLead.updatedAt = new Date().toISOString(); // Optimistic updatedAt

    setSelectedLeadForDetails(updatedLead); // Update modal state
    
    // Optimistic update for the main leads list and local storage
    setLeads(prevLeads => {
        const newLeadsArray = prevLeads.map(l => l.id === leadId ? updatedLead : l);
        const localStorageKey = getLocalStorageKey();
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(newLeadsArray));
        }
        return newLeadsArray;
    });

    try {
      const leadDocRef = doc(db, 'leads', leadId);
      await updateDoc(leadDocRef, {
        images: arrayUnion({ // Use arrayUnion to add the new image object
            public_id: newImage.public_id,
            secure_url: newImage.secure_url,
            is_featured: newImage.is_featured,
            uploaded_at: serverTimestamp() // Use serverTimestamp for Firestore
        }),
        // If making this featured means unfeaturing others, that logic needs to be handled carefully
        // For simplicity, the current logic in `newImage` handles making it featured if no others are.
        // A more robust `updateDoc` would fetch, modify array, then set.
        // For now, if newImage is featured, ensure all other images are unfeatured in a separate step or by rewriting the array.
        // The simplest way if newImage.is_featured is true:
        ...(newImage.is_featured && { images: updatedLead.images.map(img => ({...img, uploaded_at: serverTimestamp()})) }), // Rewrites entire array
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Éxito', description: 'Imagen subida y guardada.' });
      // Optionally, refetch this specific lead's data to ensure consistency if complex logic was involved
      // fetchLeads(); // Or a more targeted fetch
    } catch (error: any) {
      toast({ title: 'Error al Guardar Imagen', description: error.message, variant: 'destructive' });
      // Rollback optimistic updates if needed, or refetch
      fetchLeads(); // Refetch all leads on error to be safe
    }
  };

  const handleDeleteImageForLead = async (leadId: string, publicId: string) => {
    if (!user || !selectedLeadForDetails) return;
    setIsDeletingImage(publicId);

    const originalLeadImages = selectedLeadForDetails.images ? [...selectedLeadForDetails.images.map(img => ({...img}))] : []; // Deep copy for rollback

    // Optimistic UI update
    let updatedImages = (selectedLeadForDetails.images || []).filter(img => img.public_id !== publicId);
    const deletedImageWasFeatured = originalLeadImages.find(img => img.public_id === publicId)?.is_featured;

    // If the deleted image was featured and there are other images left, make the first one featured
    if (deletedImageWasFeatured && updatedImages.length > 0) {
      if (!updatedImages.some(img => img.is_featured)) {
        updatedImages[0].is_featured = true;
      }
    }
    
    const updatedLeadOptimistic = { ...selectedLeadForDetails, images: updatedImages, updatedAt: new Date().toISOString() };
    setSelectedLeadForDetails(updatedLeadOptimistic);
    setLeads(prevLeads => {
        const newLeadsArray = prevLeads.map(l => l.id === leadId ? updatedLeadOptimistic : l);
        const localStorageKey = getLocalStorageKey();
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(newLeadsArray));
        }
        return newLeadsArray;
    });

    try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/leads/${leadId}/images/${publicId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Error al eliminar de Cloudinary o BD."}));
            throw new Error(errorData.message);
        }
      toast({ title: 'Imagen Eliminada', description: 'La imagen ha sido eliminada del lead.' });
    } catch (error: any) {
      toast({ title: 'Error al Eliminar Imagen', description: error.message, variant: 'destructive' });
      // Rollback optimistic update for modal
      setSelectedLeadForDetails(prev => prev ? {...prev, images: originalLeadImages} : null);
      // Rollback optimistic update for main list (or refetch)
      setLeads(prev => {
        const rolledBackLeads = prev.map(l => l.id === leadId ? {...l, images: originalLeadImages, updatedAt: formatFirestoreTimestamp(l.updatedAt)} : l); // Ensure updatedAt is also consistent
         const localStorageKey = getLocalStorageKey();
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(rolledBackLeads));
        }
        return rolledBackLeads;
      })
    } finally {
      setIsDeletingImage(null);
    }
  };

  const handleSetFeaturedImageForLead = async (leadId: string, publicId: string) => {
    if (!user || !selectedLeadForDetails || !selectedLeadForDetails.images) return;
    setIsSettingFeaturedImage(publicId);

    const originalLeadImages = selectedLeadForDetails.images.map(img => ({...img})); // Deep copy

    // Optimistic UI update
    const updatedImagesOptimistic = selectedLeadForDetails.images.map(img => ({
        ...img,
        is_featured: img.public_id === publicId,
    }));
    const updatedLeadOptimistic = { ...selectedLeadForDetails, images: updatedImagesOptimistic, updatedAt: new Date().toISOString() };
    setSelectedLeadForDetails(updatedLeadOptimistic);
    setLeads(prevLeads => {
        const newLeadsArray = prevLeads.map(l => l.id === leadId ? updatedLeadOptimistic : l);
         const localStorageKey = getLocalStorageKey();
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(newLeadsArray));
        }
        return newLeadsArray;
    });

    try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/leads/${leadId}/images/${publicId}/set-featured`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Error al marcar como destacada."}));
            throw new Error(errorData.message);
        }
      toast({ title: 'Imagen Destacada Actualizada', description: 'La imagen destacada ha sido actualizada.' });
    } catch (error: any) {
      toast({ title: 'Error al Actualizar Imagen Destacada', description: error.message, variant: 'destructive' });
      // Rollback optimistic update
      setSelectedLeadForDetails(prev => prev ? {...prev, images: originalLeadImages} : null);
      setLeads(prev => {
        const rolledBackLeads = prev.map(l => l.id === leadId ? {...l, images: originalLeadImages, updatedAt: formatFirestoreTimestamp(l.updatedAt)} : l);
        const localStorageKey = getLocalStorageKey();
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(rolledBackLeads));
        }
        return rolledBackLeads;
      });
    } finally {
      setIsSettingFeaturedImage(null);
    }
  };


  if (authLoading || !initialLoadDone) {
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
  
  // Fallback if user somehow becomes null after initialLoadDone (should be handled by redirect above)
  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (!isFieldMissing(lead.email) && lead.email!.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (!isFieldMissing(lead.company) && lead.company!.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const renderKanbanView = () => (
    <div className="flex overflow-x-auto space-x-6 px-4 py-2">
      {LEAD_STAGES.map(stage => (
        <div key={stage} className="flex-shrink-0 w-[360px] min-w-[360px] max-w-[360px] flex flex-col">
          <Card className="bg-card border-border/30 shadow-none min-h-[300px] flex flex-col rounded-[var(--radius)]">
            <CardHeader className="pb-3 pt-4 px-4 sticky top-0 bg-card z-0 border-b border-border/20 rounded-t-[var(--radius)]"> 
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className={`h-3 w-3 rounded-full ${stageColors[stage].split(' ')[0]}`}></span>
                <CardTitle className="text-lg font-semibold text-foreground">{stage}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredLeads.filter(lead => lead.stage === stage).length})
                </span>
                <Button size="sm" variant="outline" onClick={() => { setSelectedColumnStage(stage); setIsColumnModalOpen(true); }}>
                  Ver Todos
                </Button>
              </div>
            </div>
            <p className="text-lg font-semibold text-primary">$0.00</p>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow overflow-y-auto p-4 pt-3 max-h-[70vh]">
              {filteredLeads.filter(lead => lead.stage === stage).length === 0 && (
                <p className="text-sm text-muted-foreground text-center pt-10">No hay leads en esta etapa.</p>
              )}
              {filteredLeads.filter(lead => lead.stage === stage).map(lead => {
                const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
                const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
                const isImportedIncomplete = isImported && (
                    isFieldMissing(lead.address) ||
                    isFieldMissing(lead.businessType) ||
                    isFieldMissing(lead.company) ||
                    isFieldMissing(lead.website)
                );
                const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));

                return (
                <Card 
                    key={lead.id} 
                    className={`bg-muted text-foreground border rounded-[var(--radius)]
                                ${currentActionLead?.id === lead.id ? 'border-primary/70' : 
                                 (selectedLeadForDetails?.id === lead.id ? 'border-primary/70' : 'border-border/20 hover:border-primary/50')}
                                ${isImportedIncomplete ? 'border-dashed border-orange-500/50' : ''} 
                                transition-colors cursor-pointer shadow-sm`}
                    onClick={() => handleOpenLeadDetailsModal(lead)}
                >
                  <CardHeader className="p-3 flex flex-row items-start justify-between space-x-2">
                    <div className="flex-grow space-y-0.5">
                        <h3 className="font-semibold text-sm text-foreground leading-tight flex items-center truncate" title={lead.name}>
                          <span className="truncate">{lead.name}</span>
                          {isLocal && (
                            <span title="Lead Local">
                              <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            </span>
                          )}
                          {isImportedIncomplete && <AlertCircle className="h-3.5 w-3.5 text-orange-400 ml-1 flex-shrink-0" />}
                        </h3>
                        <p className="text-xs text-muted-foreground/80">$0.00</p> 
                        {!isFieldMissing(lead.company) && <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={lead.company!}>{lead.company}</p>}
                        {!isFieldMissing(lead.address) && <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={lead.address!}>{lead.address}</p>}
                        
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {isLocal && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-full">Local</span>}
                          {isImported && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-full">Importado</span>}
                        </div>
                    </div>
                     <div className="flex flex-col items-end space-y-1">
                        <Avatar className="h-8 w-8 border border-border/30">
                          <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo" />
                          <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                            {lead.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary mt-auto" onClick={(e) => { e.stopPropagation(); /* TODO: Open three-dot menu */ }}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 pt-1">
                     <div className="flex items-center justify-start space-x-1 text-xs text-muted-foreground mb-2.5">
                        {!isFieldMissing(lead.phone) && (
                            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} title={`Llamar a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                <Phone className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {generateWhatsAppLink(lead) && (
                            <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Enviar WhatsApp" className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                <MessageSquareText className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {!isFieldMissing(lead.email) && (
                             <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} title={`Enviar email a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                <MailIconLucide className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {!isFieldMissing(lead.website) && (
                             <a href={lead.website!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title={`Visitar sitio web de ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className="text-xs text-muted-foreground/70 italic pl-1">Sin contacto directo</span>}
                      </div>
                       {renderActionButtons(lead)}
                    </CardContent>
                   <CardFooter className="p-3 border-t border-border/20">
                     <Select value={lead.stage} onValueChange={(newStage) => handleStageChange(lead.id, newStage as LeadStage)}>
                        <SelectTrigger className="w-full h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                            <SelectValue placeholder="Cambiar etapa" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                            {LEAD_STAGES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                   </CardFooter>
                </Card>
              )})}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="p-0"> 
      <Card className="border-border/30 bg-card text-card-foreground rounded-[var(--radius)]">
        <CardContent className="p-0"> 
          <Table>
            <TableHeader>
              <TableRow className="border-b-border/20 hover:bg-muted/10">
                <TableHead className="text-muted-foreground w-[60px] pl-4">Avatar</TableHead>
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="hidden md:table-cell text-muted-foreground">Dirección</TableHead>
                <TableHead className="text-muted-foreground">Etapa</TableHead>
                <TableHead className="hidden sm:table-cell text-muted-foreground">Actualizado</TableHead>
                <TableHead className="text-muted-foreground">Contacto</TableHead>
                <TableHead className="text-muted-foreground text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No has guardado ningún lead todavía o no coinciden con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
              {filteredLeads.map((lead, index) => {
                const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
                const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
                const isImportedIncomplete = isImported && (
                    isFieldMissing(lead.address) ||
                    isFieldMissing(lead.businessType) ||
                    isFieldMissing(lead.company) ||
                    isFieldMissing(lead.website)
                );
                const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));
                const rowClass = index % 2 === 0 ? 'bg-muted' : 'bg-muted/50';
                return (
                <TableRow key={lead.id} className={`${rowClass} ${isLocal ? 'bg-yellow-900/10 hover:bg-yellow-900/20' : ''} ${isImportedIncomplete ? 'border-l-2 border-orange-600/70' : ''} border-b-border/20`}>
                  <TableCell className="pl-4 py-2">
                    <Avatar className="h-9 w-9 border border-border/30">
                       <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo"/>
                       <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                         {lead.name.substring(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-2">
                    <div className="flex items-center">
                      <span className="hover:text-primary hover:underline cursor-pointer truncate" title={lead.name} onClick={() => handleOpenLeadDetailsModal(lead)}>{lead.name}</span>
                      {isLocal && (
                        <span title="Lead Local">
                          <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        </span>
                      )}
                      {isImportedIncomplete && (
                        <span title="Datos incompletos">
                          <AlertCircle className="h-4 w-4 text-orange-400 ml-1.5 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs max-w-xs truncate text-muted-foreground py-2" title={isFieldMissing(lead.address) ? undefined : lead.address!}>{isFieldMissing(lead.address) ? 'N/A' : lead.address}</TableCell>
                  <TableCell className="py-2">
                    <span className={`px-2 py-1 text-xs rounded-md font-medium ${stageColors[lead.stage as LeadStage] ? `${stageColors[lead.stage as LeadStage]}` : 'bg-muted text-muted-foreground'}`}>
                      {lead.stage}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground py-2">
                    {format(new Date(formatFirestoreTimestamp(lead.updatedAt)), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center space-x-1">
                      {!isFieldMissing(lead.phone) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                          <a href={`tel:${lead.phone}`} title={`Llamar a ${lead.name}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {generateWhatsAppLink(lead) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                           <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp">
                               <MessageSquareText className="h-4 w-4" />
                           </a>
                        </Button>
                       )}
                      {!isFieldMissing(lead.email) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                          <a href={`mailto:${lead.email}`} title={`Email a ${lead.name}`}>
                            <MailIconLucide className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {!isFieldMissing(lead.website) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                          <a href={lead.website!} target="_blank" rel="noopener noreferrer" title={`Visitar sitio web de ${lead.name}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className="text-xs text-muted-foreground">N/D</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2 space-y-1">
                     <Select value={lead.stage} onValueChange={(newStage) => handleStageChange(lead.id, newStage as LeadStage)}>
                        <SelectTrigger className="w-full min-w-[150px] h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                          <SelectValue placeholder="Cambiar etapa" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                          {LEAD_STAGES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end">
                        {renderActionButtons(lead)}
                      </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderActionResultModal = () => {
    if (!isActionResultModalOpen || !currentActionLead) return null;

    let title = `Resultado para ${currentActionLead.name}`;
    let content: React.ReactNode = <p>Cargando...</p>;

    if (actionResult && 'error' in actionResult && actionResult.error) {
      title = `Error - ${currentActionType || 'Acción de IA'}`;
      content = <p className="text-destructive">{actionResult.error}</p>;
    } else if (actionResult) {
      title = `${currentActionType || 'Resultado de IA'} para ${currentActionLead.name}`;
      if (currentActionType === "Mensaje de Bienvenida" && 'message' in actionResult) {
        content = <p className="whitespace-pre-wrap text-sm text-foreground">{actionResult.message}</p>;
      } else if (currentActionType === "Evaluación de Negocio" && 'evaluation' in actionResult) {
        content = <p className="whitespace-pre-wrap text-sm text-foreground">{actionResult.evaluation}</p>;
      } else if (currentActionType === "Recomendaciones de Venta" && 'recommendations' in actionResult && Array.isArray(actionResult.recommendations)) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <p>La IA sugiere los siguientes productos/servicios para <strong>{currentActionLead.name}</strong>:</p>
            {(actionResult.recommendations as { area: string, suggestion: string }[]).length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                {(actionResult.recommendations as { area: string, suggestion: string }[]).map((rec, index) => (
                    <li key={index}>
                    <strong>{rec.area}:</strong> {rec.suggestion}
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">La IA no encontró recomendaciones específicas de tu catálogo para este lead. Puedes intentarlo de nuevo o revisar el catálogo de productos.</p>
            )}
            {(!userProducts || userProducts.length === 0) && (
              <p className="text-xs text-muted-foreground mt-2">Nota: Estas son recomendaciones genéricas ya que tu catálogo de productos está vacío o no se pudo cargar.</p>
            )}
          </div>
        );
      }
    }

    return (
      <Dialog open={isActionResultModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setActionResult(null);
          setCurrentActionLead(null);
          setCurrentActionType(null);
        }
        setIsActionResultModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-muted-foreground text-muted-foreground hover:bg-muted/30 rounded-[var(--radius)]">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };


  const renderImportFileModal = () => (
    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
      <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border rounded-[var(--radius)]">
        <DialogHeader>
          <DialogTitle className="text-lg text-foreground">Importar Leads desde Archivo (con IA)</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona un archivo XML o CSV. La IA intentará extraer, formatear y sugerir una etapa para los leads.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="importFile" className="text-foreground">Archivo (XML o CSV)</Label>
            <Input
              id="importFile"
              type="file"
              accept=".xml,text/xml,.csv,text/csv"
              onChange={handleFileSelectedForImport}
              className="mt-1 bg-input text-foreground placeholder:text-muted-foreground file:text-primary file:border-0 file:bg-transparent file:font-semibold rounded-[var(--radius)]"
              disabled={isImporting}
            />
            {selectedFileForImport && <p className="text-xs text-muted-foreground mt-1">Archivo seleccionado: {selectedFileForImport.name}</p>}
          </div>
          <div>
            <Label htmlFor="importStage" className="text-foreground">Etapa por Defecto (si la IA no sugiere una)</Label>
            <Select value={importTargetStage} onValueChange={(value) => setImportTargetStage(value as LeadStage)} disabled={isImporting}>
              <SelectTrigger className="mt-1 bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                <SelectValue placeholder="Seleccionar etapa por defecto" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {LEAD_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage} className="focus:bg-accent focus:text-accent-foreground">{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={()=> setIsImportModalOpen(false)} disabled={isImporting} className="border-muted-foreground text-muted-foreground hover:bg-muted/30 rounded-[var(--radius)]">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleImportFile} disabled={!selectedFileForImport || isImporting} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius)]">
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            Importar y Formatear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderLeadDetailsModal = () => {
    if (!isLeadDetailsModalOpen || !selectedLeadForDetails || !user) return null;

    // Move edit mode and form data state to top-level component state to avoid hook order issues
    // We'll add new state hooks at the top of LeadsPage component for this purpose
    return <LeadDetailsModalContent />;
  };

  // New component for lead details modal content with hooks
  function LeadDetailsModalContent() {
    const lead = selectedLeadForDetails!;
    const featuredImageUrl = lead.images?.find(img => img.is_featured)?.secure_url;
    const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
    const hasMissingInfo = isImported && (
      isFieldMissing(lead.address) ||
      isFieldMissing(lead.businessType) ||
      isFieldMissing(lead.company) ||
      isFieldMissing(lead.website)
    );
    const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      name: lead.name || '',
      address: lead.address || '',
      phone: lead.phone || '',
      email: lead.email || '',
      website: lead.website || '',
      company: lead.company || '',
      businessType: lead.businessType || '',
      notes: lead.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      if (!user) return;
      setIsSaving(true);
      try {
        const leadDocRef = doc(db, 'leads', lead.id);
        await updateDoc(leadDocRef, {
          name: formData.name.trim() || 'Nombre no disponible',
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          company: formData.company.trim() || null,
          businessType: formData.businessType.trim() || null,
          notes: formData.notes.trim() || null,
          updatedAt: serverTimestamp(),
        });
        // Update local state
        setLeads(prevLeads => {
          const updatedLeads = prevLeads.map(l => l.id === lead.id ? { ...l, ...formData, updatedAt: new Date().toISOString() } : l);
          const localStorageKey = user ? `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${user.uid}` : null;
          if (localStorageKey) {
            localStorage.setItem(localStorageKey, JSON.stringify(updatedLeads));
          }
          return updatedLeads;
        });
        setSelectedLeadForDetails(prev => prev ? { ...prev, ...formData, updatedAt: new Date().toISOString() } : null);
        setIsEditing(false);
      } catch (error: any) {
        console.error("Error saving lead info:", error);
        // Optionally show toast here
      } finally {
        setIsSaving(false);
      }
    };

    const handleCancel = () => {
      setFormData({
        name: lead.name || '',
        address: lead.address || '',
        phone: lead.phone || '',
        email: lead.email || '',
        website: lead.website || '',
        company: lead.company || '',
        businessType: lead.businessType || '',
        notes: lead.notes || '',
      });
      setIsEditing(false);
    };

    return (
      <Dialog open={isLeadDetailsModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedLeadForDetails(null);
        setIsLeadDetailsModalOpen(isOpen);
        if (!isOpen) setIsEditing(false);
      }}>
        <DialogContent className="max-w-lg bg-popover text-popover-foreground border-border rounded-[var(--radius)]">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-xl text-foreground">{isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-lg font-semibold"
                disabled={isSaving}
              />
            ) : (
              lead.name
            )}</DialogTitle>
            <div>
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" className="mr-2" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
                  <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
              )}
            </div>
          </DialogHeader>
          <DialogDescription className="text-muted-foreground mb-4">
            Detalles y gestión de imágenes para {lead.name}. {isLocal && <span className="text-yellow-400">(Lead Local)</span>}
          </DialogDescription>

          <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {hasMissingInfo && !isEditing && (
              <Alert variant="default" className="mb-4 border-orange-600/70 bg-orange-950/30 text-orange-300 rounded-[var(--radius)]">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <AlertTitle className="text-orange-300 font-semibold">Datos Incompletos</AlertTitle>
                <AlertDescriptionShad className="text-orange-400/90">
                  Este lead fue importado. Para un mejor seguimiento y personalización, te recomendamos completar los campos faltantes como Dirección, Tipo de Negocio, Empresa y Sitio Web.
                </AlertDescriptionShad>
              </Alert>
            )}

            <div className="space-y-1 text-sm text-foreground">
              <p><strong className="text-muted-foreground">Dirección:</strong> {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.address) ? <span className="text-muted-foreground/70">N/A</span> : lead.address
              )}</p>
              <p><strong className="text-muted-foreground">Teléfono:</strong> {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.phone) ? <span className="text-muted-foreground/70">N/A</span> : lead.phone
              )}</p>
              <p><strong className="text-muted-foreground">Email:</strong> {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.email) ? <span className="text-muted-foreground/70">N/A</span> : lead.email
              )}</p>
              <p><strong className="text-muted-foreground">Sitio Web:</strong> {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.website) ? <span className="text-muted-foreground/70">N/A</span> : <a href={lead.website!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.website}</a>
              )}</p>
              <p><strong className="text-muted-foreground">Empresa:</strong> {isEditing ? (
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.company) ? <span className="text-muted-foreground/70">N/A</span> : lead.company
              )}</p>
              <p><strong className="text-muted-foreground">Tipo de Negocio:</strong> {isEditing ? (
                <input
                  type="text"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm"
                  disabled={isSaving}
                />
              ) : (
                isFieldMissing(lead.businessType) ? <span className="text-muted-foreground/70">N/A</span> : lead.businessType
              )}</p>
              <p><strong className="text-muted-foreground">Etapa Actual:</strong> <span className={`px-1.5 py-0.5 text-xs rounded-md ${stageColors[lead.stage as LeadStage] ? `${stageColors[lead.stage as LeadStage]}` : 'bg-muted text-muted-foreground'}`}>{lead.stage}</span></p>
              <p><strong className="text-muted-foreground">Fuente:</strong> {lead.source} {isLocal && <span className="text-xs text-yellow-400">(Local)</span>}</p>
              {isEditing ? (
                <div className="mt-2">
                  <Label htmlFor="notes" className="text-muted-foreground block mb-1">Notas Adicionales:</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full bg-input text-foreground rounded-[var(--radius)] px-2 py-1 text-sm resize-y min-h-[80px]"
                    disabled={isSaving}
                  />
                </div>
              ) : (
                (!isFieldMissing(lead.notes)) && <div className="mt-2"><strong className="text-muted-foreground block mb-1">Notas Adicionales:</strong><div className="whitespace-pre-wrap text-xs p-2 bg-input rounded-[var(--radius)] text-foreground">{lead.notes}</div></div>
              )}
            </div>

            <hr className="border-border/20" />

            <div>
              <h3 className="text-md font-semibold text-foreground mb-3">Imágenes del Lead</h3>
              {featuredImageUrl && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Imagen Destacada:</p>
                  <NextImage src={featuredImageUrl} alt="Imagen destacada" width={500} height={300} className="rounded-[var(--radius)] object-contain border border-border/30 max-h-[300px] w-auto" data-ai-hint="business photo"/>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {lead.images && lead.images.map(image => (
                  <Card key={image.public_id} className="group relative overflow-hidden bg-input border-border/30 rounded-[var(--radius)]">
                    <NextImage src={image.secure_url} alt="Imagen de lead" width={150} height={100} className="object-cover w-full h-24 rounded-t-[var(--radius)]" data-ai-hint="business thumbnail" />
                    <CardFooter className="p-1.5 absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-[var(--radius)]">
                      <div className="flex items-center justify-center w-full space-x-1">
                        {!image.is_featured && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 border-slate-400/50 text-slate-300/80 hover:bg-primary/20 hover:text-primary rounded-[var(--radius)]"
                            onClick={() => handleSetFeaturedImageForLead(lead.id, image.public_id)}
                            disabled={isSettingFeaturedImage === image.public_id}
                            title="Marcar como destacada"
                          >
                            {isSettingFeaturedImage === image.public_id ? <Loader2 className="h-3 w-3 animate-spin"/> : <ImagePlus className="h-3 w-3" />}
                          </Button>
                        )}
                        <Button
                          variant="destructive" 
                          size="icon"
                          className="h-6 w-6 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-[var(--radius)]"
                          onClick={() => handleDeleteImageForLead(lead.id, image.public_id)}
                          disabled={isDeletingImage === image.public_id}
                          title="Eliminar imagen"
                        >
                          {isDeletingImage === image.public_id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {(lead.images?.length || 0) < 5 && !isLocal && (
                <div className="mt-2">
                  <Label className="text-foreground mb-1 block text-sm">Añadir Nueva Imagen (máx. 5)</Label>
                  <ImageUploader
                    onUploadSuccess={(result) => handleImageUploadSuccessForLead(lead.id, result)}
                    buttonText="Subir Imagen"
                    contextId={`lead_${lead.id}_${Date.now()}`} 
                  />
                </div>
              )}
              {isLocal && (
                  <p className="text-sm text-muted-foreground">La gestión de imágenes no está disponible para leads guardados solo localmente.</p>
              )}
              {(lead.images?.length || 0) >= 5 && (
                <p className="text-sm text-muted-foreground">Has alcanzado el límite de 5 imágenes para este lead.</p>
              )}
            </div>
            <hr className="border-border/20 mt-4 mb-2" />
             <div className="space-y-2">
                {renderActionButtons(lead)}
             </div>
          </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={()=> setIsLeadDetailsModalOpen(false)} className="border-muted-foreground text-muted-foreground hover:bg-muted/30 rounded-[var(--radius)]">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderColumnModal = () => {
    if (!isColumnModalOpen || !selectedColumnStage) return null;
    const leadsInColumn = leads.filter(lead => lead.stage === selectedColumnStage);
    return (
      <Dialog open={isColumnModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsColumnModalOpen(false);
          setSelectedColumnStage(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-[90vw] bg-popover text-popover-foreground border-border rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Leads en etapa: {selectedColumnStage}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vista amplia y cómoda de todos los leads en esta etapa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {leadsInColumn.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay leads en esta etapa.</p>
            ) : (
              <div className="space-y-4">
                {leadsInColumn.map(lead => {
                  const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
                  const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
                  const isImportedIncomplete = isImported && (
                    isFieldMissing(lead.address) ||
                    isFieldMissing(lead.businessType) ||
                    isFieldMissing(lead.company) ||
                    isFieldMissing(lead.website)
                  );
                  const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));
                  return (
                    <Card 
                      key={lead.id} 
                      className={`bg-muted text-foreground border rounded-[var(--radius)]
                        ${currentActionLead?.id === lead.id ? 'border-primary/70' : 
                          (selectedLeadForDetails?.id === lead.id ? 'border-primary/70' : 'border-border/20 hover:border-primary/50')}
                        ${isImportedIncomplete ? 'border-dashed border-orange-500/50' : ''} 
                        transition-colors cursor-pointer shadow-sm`}
                      onClick={() => handleOpenLeadDetailsModal(lead)}
                    >
                      <CardHeader className="p-3 flex flex-row items-start justify-between space-x-2">
                        <div className="flex-grow space-y-0.5">
                          <h3 className="font-semibold text-sm text-foreground leading-tight flex items-center truncate" title={lead.name}>
                            <span className="truncate">{lead.name}</span>
                            {isLocal && (
                              <span title="Lead Local">
                                <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              </span>
                            )}
                            {isImportedIncomplete && <AlertCircle className="h-3.5 w-3.5 text-orange-400 ml-1 flex-shrink-0" />}
                          </h3>
                          <p className="text-xs text-muted-foreground/80">$0.00</p> 
                          {!isFieldMissing(lead.company) && <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={lead.company!}>{lead.company}</p>}
                          {!isFieldMissing(lead.address) && <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={lead.address!}>{lead.address}</p>}
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {isLocal && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-full">Local</span>}
                            {isImported && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-full">Importado</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Avatar className="h-8 w-8 border border-border/30">
                            <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo" />
                            <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                              {lead.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary mt-auto" onClick={(e) => { e.stopPropagation(); /* TODO: Open three-dot menu */ }}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-3 pt-1">
                        <div className="flex items-center justify-start space-x-1 text-xs text-muted-foreground mb-2.5">
                          {!isFieldMissing(lead.phone) && (
                            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} title={`Llamar a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {generateWhatsAppLink(lead) && (
                            <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Enviar WhatsApp" className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                              <MessageSquareText className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!isFieldMissing(lead.email) && (
                            <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} title={`Enviar email a ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                              <MailIconLucide className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!isFieldMissing(lead.website) && (
                            <a href={lead.website!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title={`Visitar sitio web de ${lead.name}`} className="p-1 hover:text-primary rounded-full hover:bg-primary/10">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className="text-xs text-muted-foreground/70 italic pl-1">Sin contacto directo</span>}
                        </div>
                        {renderActionButtons(lead)}
                      </CardContent>
                      <CardFooter className="p-3 border-t border-border/20">
                        <Select value={lead.stage} onValueChange={(newStage) => handleStageChange(lead.id, newStage as LeadStage)}>
                          <SelectTrigger className="w-full h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                            <SelectValue placeholder="Cambiar etapa" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover text-popover-foreground">
                            {LEAD_STAGES.map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-muted-foreground text-muted-foreground hover:bg-muted/30 rounded-[var(--radius)]">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "kanban" | "table")} className="flex flex-col flex-grow">
        <header className="p-4 sm:p-6 md:p-4 mb-0 max-w-full bg-background border-b border-border flex-shrink-0"> 
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground self-start sm:self-center">Mis Leads</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
               <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm w-full sm:w-auto rounded-[var(--radius)]" onClick={() => toast({title: "Próximamente", description: "La creación manual de leads estará disponible pronto."})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Lead
              </Button>
              <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 h-9 text-sm w-full sm:w-[200px] md:w-[250px] bg-input text-foreground placeholder:text-muted-foreground rounded-[var(--radius)]"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Button variant="outline" className="h-9 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground w-full sm:w-auto rounded-[var(--radius)]" disabled>
                    <Filter className="mr-2 h-4 w-4" /> Filtros
                </Button>
                <Button variant="outline" className="h-9 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground w-full sm:w-auto rounded-[var(--radius)]" disabled>
                    <Users className="mr-2 h-4 w-4" /> Agrupar por
                </Button>
              </div>
            </div>
          </div>
          <TabsList className="bg-muted p-0.5 rounded-[var(--radius)] w-full sm:w-auto justify-start sm:justify-center">
            <TabsTrigger value="kanban" className="px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-[calc(var(--radius)-2px)]">
              <KanbanSquare className="mr-1.5 h-4 w-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-[calc(var(--radius)-2px)]">
              <List className="mr-1.5 h-4 w-4" /> Tabla
            </TabsTrigger>
          </TabsList>
        </header>
        <main className="flex-grow overflow-y-auto"> 
          {loadingLeads && (!filteredLeads || filteredLeads.length === 0) ? (
            <div className="flex justify-center items-center h-[calc(100vh-250px)]">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <TabsContent value={viewMode} className="h-full mt-0 m-0 p-0 flex-grow">
                 {viewMode === "kanban" ? renderKanbanView() : renderTableView()}
            </TabsContent>
          )}
        </main>
      </Tabs>
    <div className="h-full flex flex-col bg-background p-0 md:p-0">
      
      {renderActionResultModal()}
      {renderImportFileModal()}
      {renderLeadDetailsModal()}
      {renderColumnModal()}
    </div>
    </div>
  );
}
