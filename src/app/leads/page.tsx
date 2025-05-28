
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


import type { ActionResult, ActionType } from '@/types/ai-actions';
import { ActionButtons } from '@/components/leads/ActionButtons';
import { ActionResultModal } from '@/components/leads/ActionResultModal';
import * as aiHandlers from '@/lib/lead-ai-handlers';
import type { Product as AIProduct } from '@/ai/flows/salesRecommendationsFlow';

// Keep these imports for the handlers that are still used directly
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';
import { evaluateBusinessFeatures, type EvaluateBusinessInput } from '@/ai/flows/evaluateBusinessFlow';
import { generateSalesRecommendations, type SalesRecommendationsInput } from '@/ai/flows/salesRecommendationsFlow';
import { generateContactStrategy, type GenerateContactStrategyInput } from '@/ai/flows/generateContactStrategyFlow';
import { suggestBestFollowUpTimes, type SuggestBestFollowUpTimesInput } from '@/ai/flows/suggestBestFollowUpTimesFlow';
import { generateFollowUpEmail, type GenerateFollowUpEmailInput } from '@/ai/flows/generateFollowUpEmailFlow';
import { generateObjectionHandlingGuidance, type GenerateObjectionHandlingGuidanceInput } from '@/ai/flows/generateObjectionHandlingGuidanceFlow';
import { generateProposalSummary, type GenerateProposalSummaryInput } from '@/ai/flows/generateProposalSummaryFlow';
import { generateCompetitorAnalysisInsights, type GenerateCompetitorAnalysisInsightsInput } from '@/ai/flows/generateCompetitorAnalysisInsightsFlow';
import { generateFollowUpReminderMessage, type GenerateFollowUpReminderMessageInput } from '@/ai/flows/generateFollowUpReminderMessageFlow';
import { suggestNegotiationTactics, type SuggestNegotiationTacticsInput } from '@/ai/flows/suggestNegotiationTacticsFlow';
import { developNegotiationStrategy, type DevelopNegotiationStrategyInput } from '@/ai/flows/developNegotiationStrategyFlow';
import { generateCounterOfferMessage, type GenerateCounterOfferMessageInput } from '@/ai/flows/generateCounterOfferMessageFlow';
import { generateRecoveryStrategy, type GenerateRecoveryStrategyInput } from '@/ai/flows/generateRecoveryStrategyFlow';
import { analyzeLossReasons, type AnalyzeLossReasonsInput } from '@/ai/flows/analyzeLossReasonsFlow';
import { generateCompetitorReport, type GenerateCompetitorReportInput } from '@/ai/flows/generateCompetitorReportFlow';
import { generateThankYouMessage, type GenerateThankYouMessageInput } from '@/ai/flows/generateThankYouMessageFlow';
import { generateCrossSellOpportunities, type GenerateCrossSellOpportunitiesInput } from '@/ai/flows/generateCrossSellOpportunitiesFlow';
import { generateCustomerSurvey, type GenerateCustomerSurveyInput } from '@/ai/flows/generateCustomerSurveyFlow';
import { assessRiskFactors, type AssessRiskFactorsInput } from '@/ai/flows/assessRiskFactorsFlow';

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

// ActionResult type is now imported from @/types/ai-actions

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
  const [currentActionType, setCurrentActionType] = useState<ActionType | null>(null);

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
    setIsActionResultModalOpen(true);
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
    setIsActionResultModalOpen(true);
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
    setIsActionResultModalOpen(true);

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
    }
  };

  const handleGenerateContactStrategy = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Estrategias de Contacto");
    setIsActionResultModalOpen(true);
    try {
      const input: GenerateContactStrategyInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateContactStrategy(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar estrategias de contacto. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleSuggestBestFollowUpTimes = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Mejores Momentos");

    try {
      const input: SuggestBestFollowUpTimesInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        // TODO: Add lastInteraction, leadTimeZone, countryCode when available in the lead data
      };
      const result = await suggestBestFollowUpTimes(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al sugerir mejores momentos. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateFollowUpEmail = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Email de Seguimiento");

    try {
      // Usar el nombre del usuario actual de Firebase
      const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
      
      // Usar variable de entorno para la empresa si existe, sino valor por defecto
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
      
      const input: GenerateFollowUpEmailInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        previousContextSummary: "Primera conversación sobre sus necesidades", // TODO: Get from actual interaction history
        senderName: userName,
        senderCompany: companyName,
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateFollowUpEmail(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar email de seguimiento. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateObjectionHandlingGuidance = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Manejo de Objeciones");

    try {
      const input: GenerateObjectionHandlingGuidanceInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        objectionRaised: "Es muy caro", // TODO: Get from actual conversation or allow user input
        stageInSalesProcess: lead.stage,
      };
      const result = await generateObjectionHandlingGuidance(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar guía de manejo de objeciones. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateProposalSummary = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Resumen Propuesta");

    try {
      // Para demo, usar valores predeterminados. En producción, estos vendrían de la propuesta real
      const input: GenerateProposalSummaryInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        fullProposalDetails: {
          problemStatement: "Necesidad de mejorar la presencia digital y automatizar procesos de ventas",
          proposedSolution: "Implementación de sistema CRM integrado con herramientas de marketing digital",
          keyDeliverables: [
            "Configuración de CRM personalizado",
            "Integración con redes sociales y email",
            "Capacitación del equipo",
            "Soporte por 3 meses"
          ],
          pricingSummary: "Inversión total: $5,000 USD con plan de pago flexible",
          callToAction: "Agendar reunión de kick-off para la próxima semana"
        },
        targetAudienceForSummary: "Decisor principal"
      };
      const result = await generateProposalSummary(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar resumen de propuesta. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateCompetitorAnalysisInsights = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Análisis de Competencia");

    try {
      const input: GenerateCompetitorAnalysisInsightsInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        knownCompetitors: [],
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateCompetitorAnalysisInsights(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar análisis de competencia. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateFollowUpReminderMessage = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Recordatorio de Seguimiento");

    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
      
      const input: GenerateFollowUpReminderMessageInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        daysSinceProposal: 7,
        proposalContextSummary: "Propuesta enviada para solución de automatización",
        senderName: userName,
        senderCompany: companyName,
      };
      const result = await generateFollowUpReminderMessage(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar recordatorio. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleSuggestNegotiationTactics = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Tácticas de Negociación");

    try {
      const input: SuggestNegotiationTacticsInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        proposalValue: 50000,
        previousProposalContext: "Propuesta inicial enviada con todas las características",
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await suggestNegotiationTactics(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al sugerir tácticas. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleDevelopNegotiationStrategy = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Estrategia de Negociación");

    try {
      const input: DevelopNegotiationStrategyInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        negotiationContext: "Cliente interesado pero con dudas sobre el precio",
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await developNegotiationStrategy(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al desarrollar estrategia. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateCounterOfferMessage = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Contraoferta");

    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
      
      const input: GenerateCounterOfferMessageInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        originalOfferValue: 50000,
        counterOfferValue: 45000,
        justificationContext: "Ajuste de precio por volumen de compra",
        senderName: userName,
        senderCompany: companyName,
      };
      const result = await generateCounterOfferMessage(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar contraoferta. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  // Handlers for "Perdido" stage
  const handleGenerateRecoveryStrategy = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Recuperación");

    try {
      const input: GenerateRecoveryStrategyInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        lossReason: "Optaron por competidor con precio más bajo",
        timesSinceLoss: 30,
        competitorWhoWon: "Competidor local",
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateRecoveryStrategy(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar estrategia de recuperación. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleAnalyzeLossReasons = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Análisis de Pérdidas");

    try {
      const input: AnalyzeLossReasonsInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        lossReason: "Precio demasiado alto para su presupuesto",
        competitorWhoWon: "Competidor con solución más básica",
        proposalValue: 5000,
        salesCycleLength: 45,
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await analyzeLossReasons(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al analizar razones de pérdida. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateCompetitorReport = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Informe de Competidores");

    try {
      const input: GenerateCompetitorReportInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        competitorWhoWon: "SoftLocal Solutions",
        competitorSolution: "Sistema CRM básico con funcionalidades limitadas",
        competitorPrice: 3500,
        ourProposalValue: 5000,
        lossReason: "Diferencia de precio y simplicidad de implementación",
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateCompetitorReport(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar informe de competidores. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  // Handlers for "Ganado" stage
  const handleGenerateThankYouMessage = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Agradecimiento");

    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
      
      const input: GenerateThankYouMessageInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        purchasedSolution: userProducts.length > 0 ? userProducts[0].name : "Solución personalizada",
        purchaseValue: 5000,
        implementationDate: "Próximas 2 semanas",
        senderName: userName,
        senderCompany: companyName,
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateThankYouMessage(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar mensaje de agradecimiento. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateCrossSellOpportunities = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Venta Cruzada");

    try {
      const input: GenerateCrossSellOpportunitiesInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        currentSolution: userProducts.length > 0 ? userProducts[0].name : "Solución implementada",
        purchaseValue: 5000,
        implementationStatus: "Exitosa - 3 meses de uso",
        satisfactionLevel: "Alta",
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateCrossSellOpportunities(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar oportunidades de venta cruzada. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  const handleGenerateCustomerSurvey = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Encuesta Cliente");

    try {
      const userName = user.displayName || user.email?.split('@')[0] || "Tu nombre";
      const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Nuestra empresa";
      
      const input: GenerateCustomerSurveyInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        purchasedSolution: userProducts.length > 0 ? userProducts[0].name : "Solución implementada",
        implementationDate: "Hace 3 meses",
        timeWithSolution: 90,
        senderName: userName,
        senderCompany: companyName,
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await generateCustomerSurvey(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al generar encuesta de cliente. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };

  // Handler for risk assessment (any stage)
  const handleAssessRiskFactors = async (lead: Lead) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Inicia sesión para usar las acciones de IA.", variant: "destructive" });
      return;
    }
    setCurrentActionLead(lead);
    setIsActionLoading(true);
    setActionResult(null);
    setCurrentActionType("Evaluación de Riesgos");

    try {
      const input: AssessRiskFactorsInput = {
        leadId: lead.id,
        leadName: lead.name,
        businessType: isFieldMissing(lead.businessType) ? undefined : lead.businessType!,
        leadStage: lead.stage,
        leadNotes: isFieldMissing(lead.notes) ? undefined : lead.notes!,
        proposalValue: 5000,
        decisionTimeframe: "Próximas 4 semanas",
        competitionLevel: "Media - 2 competidores identificados",
        budgetStatus: "Confirmado pero ajustado",
        decisionMakers: ["CEO", "CFO", "CTO"],
        userProducts: userProducts.length > 0 ? userProducts : undefined,
      };
      const result = await assessRiskFactors(input);
      setActionResult(result);
    } catch (error: any) {
      setActionResult({ error: error.message || "Error al evaluar factores de riesgo. Asegúrate de que la API Key de Gemini esté configurada." });
    } finally {
      setIsActionLoading(false);
      setIsActionResultModalOpen(true);
    }
  };
  
  const renderActionResultModal = () => {
    if (!isActionResultModalOpen || !currentActionLead) return null;

    let title = `Resultado para ${currentActionLead.name}`;
    let content: React.ReactNode = <p>Cargando...</p>;

    if (isActionLoading) {
      content = (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-primary">Generando sugerencia...</span>
        </div>
      );
    } else if (actionResult && 'error' in actionResult && actionResult.error) {
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
      } else if (currentActionType === "Estrategias de Contacto" && 'suggestedChannels' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <h4 className="font-semibold mb-2">Canales de Contacto Sugeridos:</h4>
              <ul className="space-y-2">
                {(actionResult.suggestedChannels as { channel: string, reasoning: string }[]).map((ch, index) => (
                  <li key={index} className="flex flex-col space-y-1">
                    <span className="font-medium">{ch.channel}</span>
                    <span className="text-muted-foreground text-xs">{ch.reasoning}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Puntos Clave de Conversación:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {('keyTalkingPoints' in actionResult && Array.isArray(actionResult.keyTalkingPoints) ? actionResult.keyTalkingPoints as string[] : []).map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            
            {'openingLineSuggestion' in actionResult && actionResult.openingLineSuggestion && (
              <div>
                <h4 className="font-semibold mb-2">Sugerencia de Apertura:</h4>
                <p className="bg-muted/30 p-2 rounded text-xs italic">{actionResult.openingLineSuggestion}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-2">Objetivo Principal del Contacto:</h4>
              <p className="text-primary font-medium">{'primaryGoalOfContact' in actionResult ? actionResult.primaryGoalOfContact : ''}</p>
            </div>
          </div>
        );
      } else if (currentActionType === "Mejores Momentos" && 'recommendations' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <h4 className="font-semibold mb-2">Mejores Momentos para Seguimiento:</h4>
              <div className="space-y-3">
                {(actionResult.recommendations as { dayOfWeek: string, timeSlotLocal: string, reasoning: string }[]).map((rec, index) => (
                  <div key={index} className="bg-muted/20 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{rec.dayOfWeek} - {rec.timeSlotLocal}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{rec.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {'generalTips' in actionResult && actionResult.generalTips && Array.isArray(actionResult.generalTips) && actionResult.generalTips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Consejos Generales:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.generalTips as string[]).map((tip, index) => (
                    <li key={index} className="text-xs">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Email de Seguimiento" && 'subject' in actionResult && 'body' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <h4 className="font-semibold mb-2">Asunto del Email:</h4>
              <p className="bg-muted/20 p-2 rounded-md font-medium">{actionResult.subject}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Cuerpo del Email:</h4>
              <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap text-xs">
                {actionResult.body}
              </div>
            </div>
            
            {'customizationPoints' in actionResult && actionResult.customizationPoints && Array.isArray(actionResult.customizationPoints) && actionResult.customizationPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Sugerencias de Personalización:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.customizationPoints as string[]).map((point, index) => (
                    <li key={index} className="text-xs text-muted-foreground">{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Manejo de Objeciones" && 'objectionCategory' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="font-semibold">Categoría de Objeción: <span className="text-primary">{actionResult.objectionCategory}</span></p>
            </div>
            
            {'empathyStatement' in actionResult && actionResult.empathyStatement && (
              <div>
                <h4 className="font-semibold mb-2">Declaración de Empatía:</h4>
                <p className="bg-muted/20 p-3 rounded-md italic">&ldquo;{actionResult.empathyStatement}&rdquo;</p>
              </div>
            )}
            
            {'suggestedResponses' in actionResult && Array.isArray(actionResult.suggestedResponses) && (
              <div>
                <h4 className="font-semibold mb-2">Estrategias de Respuesta:</h4>
                <div className="space-y-3">
                  {(actionResult.suggestedResponses as any[]).map((response, index) => (
                    <div key={index} className="border border-border/50 rounded-md p-3">
                      <h5 className="font-semibold text-primary mb-2">{response.strategyName}</h5>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium mb-1">Puntos clave:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {response.responsePoints.map((point: string, idx: number) => (
                              <li key={idx} className="text-xs">{point}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {response.pros && response.pros.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Ventajas:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {response.pros.map((pro: string, idx: number) => (
                                <li key={idx} className="text-xs text-green-600">{pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {response.consOrWatchouts && response.consOrWatchouts.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-orange-600 mb-1">Consideraciones:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {response.consOrWatchouts.map((con: string, idx: number) => (
                                <li key={idx} className="text-xs text-orange-600">{con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'clarifyingQuestions' in actionResult && actionResult.clarifyingQuestions && Array.isArray(actionResult.clarifyingQuestions) && actionResult.clarifyingQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Preguntas de Aclaración:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.clarifyingQuestions as string[]).map((question, index) => (
                    <li key={index} className="text-xs">{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Resumen Propuesta" && 'summaryTitle' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <h3 className="font-bold text-lg text-primary">{actionResult.summaryTitle}</h3>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Resumen Ejecutivo:</h4>
              <p className="bg-muted/20 p-3 rounded-md leading-relaxed">
                {actionResult.executiveSummary}
              </p>
            </div>
            
            {'keyBenefitsAlignedWithNeeds' in actionResult && Array.isArray(actionResult.keyBenefitsAlignedWithNeeds) && (
              <div>
                <h4 className="font-semibold mb-2">Beneficios Clave Alineados con Necesidades:</h4>
                <div className="space-y-2">
                  {(actionResult.keyBenefitsAlignedWithNeeds as any[]).map((item, index) => (
                    <div key={index} className="flex gap-2 bg-muted/10 p-2 rounded-md">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Necesidad:</p>
                        <p className="text-sm">{item.need}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-primary">Beneficio:</p>
                        <p className="text-sm">{item.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'uniqueSellingPropositionHighlight' in actionResult && actionResult.uniqueSellingPropositionHighlight && (
              <div>
                <h4 className="font-semibold mb-2">Propuesta de Valor Única:</h4>
                <p className="bg-primary/20 p-3 rounded-md border-l-4 border-primary">
                  {actionResult.uniqueSellingPropositionHighlight}
                </p>
              </div>
            )}
            
            {'suggestedNextStepFromProposal' in actionResult && (
              <div>
                <h4 className="font-semibold mb-2">Próximo Paso Sugerido:</h4>
                <div className="bg-primary text-primary-foreground p-3 rounded-md flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <p className="font-medium">{actionResult.suggestedNextStepFromProposal}</p>
                </div>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Análisis de Competencia" && 'competitorComparisonMatrix' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            {'competitorComparisonMatrix' in actionResult && Array.isArray(actionResult.competitorComparisonMatrix) && (
              <div>
                <h4 className="font-semibold mb-2">Matriz de Comparación con Competidores:</h4>
                <div className="space-y-2">
                  {(actionResult.competitorComparisonMatrix as any[]).map((item, index) => (
                    <div key={index} className="bg-muted/10 p-3 rounded-md">
                      <p className="font-medium text-primary">{item.feature}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Tu Oferta:</p>
                          <p className="text-sm">{item.yourOffering}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Competidor:</p>
                          <p className="text-sm">{item.competitorOffering}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'uniqueDifferentiators' in actionResult && Array.isArray(actionResult.uniqueDifferentiators) && (
              <div>
                <h4 className="font-semibold mb-2">Diferenciadores Únicos:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.uniqueDifferentiators as string[]).map((diff, index) => (
                    <li key={index}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'potentialVulnerabilities' in actionResult && Array.isArray(actionResult.potentialVulnerabilities) && (
              <div>
                <h4 className="font-semibold mb-2">Áreas de Mejora:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.potentialVulnerabilities as string[]).map((vuln, index) => (
                    <li key={index} className="text-amber-600">{vuln}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'positioningRecommendation' in actionResult && (
              <div className="bg-primary/10 p-3 rounded-md">
                <h4 className="font-semibold mb-1">Recomendación de Posicionamiento:</h4>
                <p>{actionResult.positioningRecommendation}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Recordatorio de Seguimiento" && 'reminderSubject' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="font-semibold">Asunto:</p>
              <p>{actionResult.reminderSubject}</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Mensaje:</p>
              <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap">
                {actionResult.reminderMessage}
              </div>
            </div>
            
            {'suggestedCallToAction' in actionResult && (
              <div className="bg-primary text-primary-foreground p-3 rounded-md">
                <p className="font-semibold mb-1">Llamada a la Acción:</p>
                <p>{actionResult.suggestedCallToAction}</p>
              </div>
            )}
            
            {'followUpTone' in actionResult && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bell className="h-4 w-4" />
                <p className="text-xs">Tono: {actionResult.followUpTone}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Tácticas de Negociación" && 'suggestedTactics' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            {'suggestedTactics' in actionResult && Array.isArray(actionResult.suggestedTactics) && (
              <div>
                <h4 className="font-semibold mb-2">Tácticas Sugeridas:</h4>
                <div className="space-y-2">
                  {(actionResult.suggestedTactics as any[]).map((tactic, index) => (
                    <div key={index} className="bg-muted/10 p-3 rounded-md">
                      <p className="font-medium text-primary">{tactic.tacticName}</p>
                      <p className="text-sm mt-1">{tactic.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Cuándo usar: {tactic.whenToUse}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'primaryNegotiationGoal' in actionResult && (
              <div className="bg-primary/10 p-3 rounded-md">
                <h4 className="font-semibold mb-1">Objetivo Principal:</h4>
                <p>{actionResult.primaryNegotiationGoal}</p>
              </div>
            )}
            
            {'fallbackPositions' in actionResult && Array.isArray(actionResult.fallbackPositions) && (
              <div>
                <h4 className="font-semibold mb-2">Posiciones de Respaldo:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {(actionResult.fallbackPositions as string[]).map((pos, index) => (
                    <li key={index}>{pos}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Estrategia de Negociación" && 'negotiationApproach' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <h4 className="font-semibold mb-1">Enfoque de Negociación:</h4>
              <p>{actionResult.negotiationApproach}</p>
            </div>
            
            {'keyNegotiationPoints' in actionResult && Array.isArray(actionResult.keyNegotiationPoints) && (
              <div>
                <h4 className="font-semibold mb-2">Puntos Clave de Negociación:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.keyNegotiationPoints as string[]).map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'concessionsHierarchy' in actionResult && Array.isArray(actionResult.concessionsHierarchy) && (
              <div>
                <h4 className="font-semibold mb-2">Jerarquía de Concesiones:</h4>
                <div className="space-y-2">
                  {(actionResult.concessionsHierarchy as any[]).map((concession, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold">
                        Nivel {concession.level}
                      </span>
                      <span className="text-sm">{concession.concession}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'bestAlternativeToNegotiatedAgreement' in actionResult && (
              <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-md border-l-4 border-amber-500">
                <h4 className="font-semibold mb-1">BATNA:</h4>
                <p>{actionResult.bestAlternativeToNegotiatedAgreement}</p>
              </div>
            )}
            
            {'emotionalIntelligenceTips' in actionResult && Array.isArray(actionResult.emotionalIntelligenceTips) && (
              <div>
                <h4 className="font-semibold mb-2">Tips de Inteligencia Emocional:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.emotionalIntelligenceTips as string[]).map((tip, index) => (
                    <li key={index} className="text-xs">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Contraoferta" && 'counterOfferSubject' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="font-semibold">Asunto:</p>
              <p>{actionResult.counterOfferSubject}</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Mensaje de Contraoferta:</p>
              <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap">
                {actionResult.counterOfferMessage}
              </div>
            </div>
            
            {'valueJustificationPoints' in actionResult && Array.isArray(actionResult.valueJustificationPoints) && (
              <div>
                <h4 className="font-semibold mb-2">Puntos de Justificación del Valor:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.valueJustificationPoints as string[]).map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'psychologicalFraming' in actionResult && (
              <div className="bg-primary/20 p-3 rounded-md">
                <h4 className="font-semibold mb-1">Marco Psicológico:</h4>
                <p className="text-sm">{actionResult.psychologicalFraming}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Recuperación" && 'recoveryApproach' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <h4 className="font-semibold mb-1">Enfoque de Recuperación:</h4>
              <p>{actionResult.recoveryApproach}</p>
            </div>
            
            {'keyRecoveryMessages' in actionResult && Array.isArray(actionResult.keyRecoveryMessages) && (
              <div>
                <h4 className="font-semibold mb-2">Mensajes Clave de Recuperación:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.keyRecoveryMessages as string[]).map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'timingStrategy' in actionResult && (
              <div>
                <h4 className="font-semibold mb-2">Estrategia de Timing:</h4>
                <p className="bg-muted/20 p-3 rounded-md">{actionResult.timingStrategy}</p>
              </div>
            )}
            
            {'incentivesOrOffers' in actionResult && Array.isArray(actionResult.incentivesOrOffers) && (
              <div>
                <h4 className="font-semibold mb-2">Incentivos y Ofertas:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.incentivesOrOffers as string[]).map((offer, index) => (
                    <li key={index}>{offer}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'relationshipRebuildingTactics' in actionResult && Array.isArray(actionResult.relationshipRebuildingTactics) && (
              <div>
                <h4 className="font-semibold mb-2">Tácticas de Reconstrucción:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.relationshipRebuildingTactics as string[]).map((tactic, index) => (
                    <li key={index}>{tactic}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'successProbabilityAssessment' in actionResult && (
              <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-md border-l-4 border-amber-500">
                <h4 className="font-semibold mb-1">Probabilidad de Éxito:</h4>
                <p>{actionResult.successProbabilityAssessment}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Análisis de Pérdidas" && 'primaryLossCategory' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-destructive/10 p-3 rounded-md">
              <h4 className="font-semibold mb-1">Categoría Principal de Pérdida:</h4>
              <p className="font-medium text-destructive">{actionResult.primaryLossCategory}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Análisis Detallado:</h4>
              <p className="bg-muted/20 p-3 rounded-md leading-relaxed">{actionResult.detailedLossAnalysis}</p>
            </div>
            
            {'preventableFactors' in actionResult && Array.isArray(actionResult.preventableFactors) && (
              <div>
                <h4 className="font-semibold mb-2">Factores Prevenibles:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.preventableFactors as string[]).map((factor, index) => (
                    <li key={index} className="text-amber-600">{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'nonPreventableFactors' in actionResult && Array.isArray(actionResult.nonPreventableFactors) && (
              <div>
                <h4 className="font-semibold mb-2">Factores No Prevenibles:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.nonPreventableFactors as string[]).map((factor, index) => (
                    <li key={index} className="text-muted-foreground">{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'processImprovements' in actionResult && Array.isArray(actionResult.processImprovements) && (
              <div>
                <h4 className="font-semibold mb-2">Mejoras de Proceso:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.processImprovements as string[]).map((improvement, index) => (
                    <li key={index} className="text-primary">{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'futurePreventionStrategy' in actionResult && (
              <div className="bg-primary/10 p-3 rounded-md">
                <h4 className="font-semibold mb-1">Estrategia de Prevención Futura:</h4>
                <p>{actionResult.futurePreventionStrategy}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Informe de Competidores" && 'competitorProfile' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <h4 className="font-semibold mb-2">Perfil del Competidor:</h4>
              <p className="bg-muted/20 p-3 rounded-md">{actionResult.competitorProfile}</p>
            </div>
            
            {'productComparison' in actionResult && Array.isArray(actionResult.productComparison) && (
              <div>
                <h4 className="font-semibold mb-2">Comparación de Productos:</h4>
                <div className="space-y-2">
                  {(actionResult.productComparison as any[]).map((item, index) => (
                    <div key={index} className="bg-muted/10 p-3 rounded-md">
                      <p className="font-medium text-primary">{item.feature}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Competidor:</p>
                          <p className="text-sm">{item.competitor}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nuestra Oferta:</p>
                          <p className="text-sm">{item.ourOffering}</p>
                        </div>
                      </div>
                      <p className="text-xs mt-2 font-medium">
                        Ventaja: <span className={item.advantage === 'Nosotros' ? 'text-green-600' : 'text-amber-600'}>
                          {item.advantage}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'strategicRecommendations' in actionResult && Array.isArray(actionResult.strategicRecommendations) && (
              <div>
                <h4 className="font-semibold mb-2">Recomendaciones Estratégicas:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.strategicRecommendations as string[]).map((rec, index) => (
                    <li key={index} className="text-primary">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'futureCompetitiveStrategy' in actionResult && (
              <div className="bg-primary/10 p-3 rounded-md">
                <h4 className="font-semibold mb-1">Estrategia Competitiva Futura:</h4>
                <p>{actionResult.futureCompetitiveStrategy}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Agradecimiento" && 'thankYouSubject' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <p className="font-semibold">Asunto:</p>
              <p>{actionResult.thankYouSubject}</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Mensaje de Agradecimiento:</p>
              <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap">
                {actionResult.thankYouMessage}
              </div>
            </div>
            
            {'nextSteps' in actionResult && Array.isArray(actionResult.nextSteps) && (
              <div>
                <h4 className="font-semibold mb-2">Próximos Pasos:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {(actionResult.nextSteps as string[]).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {'onboardingHighlights' in actionResult && Array.isArray(actionResult.onboardingHighlights) && (
              <div>
                <h4 className="font-semibold mb-2">Destacados del Onboarding:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.onboardingHighlights as string[]).map((highlight, index) => (
                    <li key={index} className="text-primary">{highlight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'personalizedTouch' in actionResult && (
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md border-l-4 border-green-500">
                <h4 className="font-semibold mb-1">Toque Personal:</h4>
                <p>{actionResult.personalizedTouch}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Venta Cruzada" && 'crossSellRecommendations' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            {'crossSellRecommendations' in actionResult && Array.isArray(actionResult.crossSellRecommendations) && (
              <div>
                <h4 className="font-semibold mb-2">Recomendaciones de Venta Cruzada:</h4>
                <div className="space-y-3">
                  {(actionResult.crossSellRecommendations as any[]).map((rec, index) => (
                    <div key={index} className="bg-muted/10 p-3 rounded-md">
                      <h5 className="font-medium text-primary">{rec.productName}</h5>
                      <p className="text-sm mt-1">{rec.relevanceReason}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-green-600 font-semibold">{rec.estimatedValue}</span>
                        <span className="text-xs text-muted-foreground">{rec.implementationComplexity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'bundleOpportunities' in actionResult && Array.isArray(actionResult.bundleOpportunities) && (
              <div>
                <h4 className="font-semibold mb-2">Oportunidades de Bundle:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(actionResult.bundleOpportunities as string[]).map((bundle, index) => (
                    <li key={index} className="text-primary">{bundle}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {'optimalTiming' in actionResult && (
              <div>
                <h4 className="font-semibold mb-2">Timing Óptimo:</h4>
                <p className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-md">{actionResult.optimalTiming}</p>
              </div>
            )}
            
            {'expectedROI' in actionResult && (
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md border-l-4 border-green-500">
                <h4 className="font-semibold mb-1">ROI Esperado:</h4>
                <p>{actionResult.expectedROI}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Encuesta Cliente" && 'surveyTitle' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className="bg-primary/10 p-3 rounded-md">
              <h3 className="font-bold text-lg text-primary">{actionResult.surveyTitle}</h3>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Mensaje de Introducción:</h4>
              <div className="bg-muted/20 p-3 rounded-md whitespace-pre-wrap text-xs">
                {actionResult.introMessage}
              </div>
            </div>
            
            {'surveyQuestions' in actionResult && Array.isArray(actionResult.surveyQuestions) && (
              <div>
                <h4 className="font-semibold mb-2">Preguntas de la Encuesta:</h4>
                <div className="space-y-2">
                  {(actionResult.surveyQuestions as any[]).slice(0, 4).map((q, index) => (
                    <div key={index} className="bg-muted/10 p-2 rounded-md">
                      <p className="font-medium text-xs">{q.category}</p>
                      <p className="text-sm">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">Tipo: {q.type}</p>
                    </div>
                  ))}
                  {(actionResult.surveyQuestions as any[]).length > 4 && (
                    <p className="text-xs text-muted-foreground">... y {(actionResult.surveyQuestions as any[]).length - 4} preguntas más</p>
                  )}
                </div>
              </div>
            )}
            
            {'incentiveOffered' in actionResult && (
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md border-l-4 border-green-500">
                <h4 className="font-semibold mb-1">Incentivo Ofrecido:</h4>
                <p className="text-xs">{actionResult.incentiveOffered}</p>
              </div>
            )}
            
            {'estimatedCompletionTime' in actionResult && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <p className="text-xs">Tiempo estimado: {actionResult.estimatedCompletionTime}</p>
              </div>
            )}
          </div>
        );
      } else if (currentActionType === "Evaluación de Riesgos" && 'overallRiskLevel' in actionResult) {
        content = (
          <div className="space-y-3 text-sm text-foreground">
            <div className={`p-3 rounded-md ${actionResult.overallRiskLevel === 'Alto' ? 'bg-red-100 dark:bg-red-900/20' : actionResult.overallRiskLevel === 'Medio' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
              <h4 className="font-semibold mb-1">Nivel de Riesgo General:</h4>
              <div className="flex items-center gap-2">
                <span className="font-bold">{actionResult.overallRiskLevel}</span>
                {'riskScore' in actionResult && (
                  <span className="text-xs">Score: {actionResult.riskScore}/100</span>
                )}
              </div>
            </div>
            
            {'highRiskFactors' in actionResult && Array.isArray(actionResult.highRiskFactors) && actionResult.highRiskFactors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Factores de Alto Riesgo:</h4>
                <div className="space-y-2">
                  {(actionResult.highRiskFactors as any[]).map((risk, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/10 p-3 rounded-md border-l-4 border-red-500">
                      <p className="font-medium">{risk.factor}</p>
                      <p className="text-xs text-muted-foreground mt-1">Impacto: {risk.impact}</p>
                      <p className="text-xs text-muted-foreground">Probabilidad: {risk.probability}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'mitigationStrategies' in actionResult && Array.isArray(actionResult.mitigationStrategies) && (
              <div>
                <h4 className="font-semibold mb-2">Estrategias de Mitigación:</h4>
                <div className="space-y-2">
                  {(actionResult.mitigationStrategies as any[]).map((strategy, index) => (
                    <div key={index} className="bg-muted/10 p-3 rounded-md">
                      <p className="font-medium text-primary">{strategy.risk}</p>
                      <p className="text-sm mt-1">{strategy.strategy}</p>
                      <p className="text-xs text-muted-foreground mt-1">Timeline: {strategy.timeline}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {'actionPriorities' in actionResult && Array.isArray(actionResult.actionPriorities) && (
              <div>
                <h4 className="font-semibold mb-2">Prioridades de Acción:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {(actionResult.actionPriorities as string[]).map((priority, index) => (
                    <li key={index} className="text-xs">{priority}</li>
                  ))}
                </ol>
              </div>
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
          onClick={(e) => { e.stopPropagation(); handleGenerateWelcomeMessage(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateContactStrategy(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Estrategias de Contacto" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Estrategias de Contacto
        </Button>
      );
      // Recomendar mejores momentos para seguimiento
      buttons.push(
        <Button
          key="bestFollowUpTimes"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleSuggestBestFollowUpTimes(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Mejores Momentos" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Clock className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Mejores Momentos
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
          onClick={(e) => { e.stopPropagation(); handleEvaluateBusiness(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateSalesRecommendations(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateFollowUpEmail(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Email de Seguimiento" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <MailIconLucide className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Seguimiento
        </Button>
      );
      // Sugerir consejos para manejar objeciones
      buttons.push(
        <Button
          key="objectionHandling"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateObjectionHandlingGuidance(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Manejo de Objeciones" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Manejo de Objeciones
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
          onClick={(e) => { e.stopPropagation(); handleEvaluateBusiness(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateSalesRecommendations(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateProposalSummary(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Resumen Propuesta" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Resumen Propuesta
        </Button>
      );
      // Sugerir análisis comparativo con competidores
      buttons.push(
        <Button
          key="competitorAnalysis"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateCompetitorAnalysisInsights(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Análisis de Competencia" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Users className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Análisis Competidores
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
          onClick={(e) => { e.stopPropagation(); handleGenerateSalesRecommendations(lead); }}
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
          onClick={(e) => { e.stopPropagation(); handleGenerateFollowUpReminderMessage(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Recordatorio de Seguimiento" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Bell className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Recordatorio Seguimiento
        </Button>
      );
      // Sugerir tácticas de negociación o concesiones
      buttons.push(
        <Button
          key="negotiationTactics"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleSuggestNegotiationTactics(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Tácticas de Negociación" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Handshake className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Tácticas Negociación
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
          onClick={(e) => { e.stopPropagation(); handleDevelopNegotiationStrategy(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Estrategia de Negociación" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Handshake className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Estrategia Negociación
        </Button>
      );
      buttons.push(
        <Button
          key="counterOffer"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateCounterOfferMessage(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Contraoferta" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <FileText className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Contraoferta
        </Button>
      );
      buttons.push(
        <Button
          key="riskAssessment"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleAssessRiskFactors(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Evaluación de Riesgos" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Evaluación Riesgos
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
          onClick={(e) => { e.stopPropagation(); handleGenerateThankYouMessage(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Agradecimiento" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Heart className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Agradecimiento
        </Button>
      );
      buttons.push(
        <Button
          key="crossSell"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateCrossSellOpportunities(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Venta Cruzada" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <PackageSearch className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Venta Cruzada
        </Button>
      );
      buttons.push(
        <Button
          key="customerSurvey"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateCustomerSurvey(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Encuesta Cliente" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Encuesta Cliente
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
          onClick={(e) => { e.stopPropagation(); handleGenerateRecoveryStrategy(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Recuperación" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Repeat className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Recuperación
        </Button>
      );
      buttons.push(
        <Button
          key="lossAnalysis"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleAnalyzeLossReasons(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Análisis de Pérdidas" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Análisis Pérdidas
        </Button>
      );
      buttons.push(
        <Button
          key="competitorReport"
          variant="ghost"
          size="sm"
          className="pointer text-xs h-7 px-2 text-foreground bg-primary/10 text-primary flex-grow bg-gray-800"
          onClick={(e) => { e.stopPropagation(); handleGenerateCompetitorReport(lead); }}
          disabled={isActionLoading && currentActionLead?.id === lead.id}
        >
          {isActionLoading && currentActionLead?.id === lead.id && currentActionType === "Informe de Competidores" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Users className="h-3.5 w-3.5 mr-1.5" />
          )}{" "}
          Informe Competidores
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
          <div key={btn.key} className="flex-grow shadow-sm w-full rounded-sm">
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
