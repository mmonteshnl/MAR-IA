
import type { Timestamp } from 'firebase/firestore';
import type { MetaLeadAdsModel } from './meta-lead-ads';

export interface OpeningHours {
  open_now?: boolean;
  weekday_text?: string[];
}

export interface BusinessDetail {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  international_phone_number?: string;
  website?: string;
  types?: string[];
  rating?: number;
    opening_hours?: OpeningHours;
  }

export interface LeadImage {
  public_id: string;
  secure_url: string;
  is_featured: boolean;
  uploaded_at: Timestamp | string; // Allow string for client-side optimistic updates
}

// Re-export MetaLeadAdsModel as the primary Lead type
export type { MetaLeadAdsModel as Lead } from './meta-lead-ads';

// Extended Lead interface with additional fields for UI and compatibility
export interface ExtendedLead extends MetaLeadAdsModel {
  id: string; // Firestore document ID
  uid: string; // User ID - derived from context
  organizationId: string; // Organization ID - derived from context
  stage: 'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta Enviada' | 'Negociación' | 'Ganado' | 'Perdido' | 'Prospecto' | 'Interesado' | 'Propuesta' | 'Vendido';
  source: string; // Derived from lead data analysis
  images?: LeadImage[];
  featured_image_url?: string; // Denormalized for quick display
  
  // Computed/derived fields for backward compatibility
  name: string; // Maps to fullName
  email: string; // Direct mapping
  phone: string; // Maps to phoneNumber
  company: string; // Maps to companyName
  address?: string | null; // Derived from homeListing or other sources
  website?: string | null; // Not available in Meta model, kept for imports
  businessType?: string | null; // Derived from campaign/vehicle/home analysis
  notes?: string | null; // Maps to customDisclaimerResponses or derived
  placeId?: string | null; // Only for Google Places leads, stored in platformId
}

export interface Product {
  id?: string; // Firestore document ID
  uid: string; // User ID
  name: string;
  category: string;
  description?: string;
  price: string;
  original_price?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  images?: LeadImage[];
}

export interface Service {
  id?: string; // Firestore document ID
  uid: string; // User ID
  name: string;
  category: string;
  description?: string;
  price: string;
  original_price?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  // No images for services for now, can be added later if needed
}
