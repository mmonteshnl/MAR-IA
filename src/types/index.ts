
import type { Timestamp } from 'firebase/firestore';

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

export interface Lead {
  id: string;
  uid: string;
  organizationId?: string; // New field for organization-based filtering
  placeId?: string | null; // Made optional for imported leads
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  email?: string | null;
  company?: string | null;
  businessType?: string | null; // For AI context
  notes?: string | null;
  source: string;
  stage: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  images?: LeadImage[];
  featured_image_url?: string; // Denormalized for quick display

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
