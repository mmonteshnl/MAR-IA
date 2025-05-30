import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

export const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
export const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';

export const LEAD_STAGES = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

export type LeadStage = typeof LEAD_STAGES[number];

export const stageColors: Record<LeadStage, string> = {
  Nuevo: 'bg-muted text-muted-foreground',
  Contactado: 'bg-primary/10 text-primary',
  Calificado: 'bg-secondary text-secondary-foreground',
  'Propuesta Enviada': 'bg-primary/20 text-primary',
  Negociación: 'bg-primary/30 text-primary-foreground',
  Ganado: 'bg-primary text-primary-foreground',
  Perdido: 'bg-destructive text-destructive-foreground',
};

export function formatFirestoreTimestamp(timestamp: any): string {
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

export function isFieldMissing(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value.trim() === "") return true;
  const lowerValue = value.toLowerCase();
  return lowerValue === "sin direccion" || lowerValue === "n/a" || lowerValue === "no disponible" || lowerValue === "desconocido" || lowerValue === "null" || lowerValue === "undefined";
}

export function generateWhatsAppLink(lead: { phone?: string | null }): string | null {
  if (!lead.phone || isFieldMissing(lead.phone)) return null;
  const phoneNumber = lead.phone.replace(/\D/g, '');
  return `https://wa.me/${phoneNumber}`;
}