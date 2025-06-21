
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

// Re-export UnifiedLead system
export type { 
  UnifiedLead, 
  CreateLeadInput, 
  UpdateLeadInput, 
  LeadFilters,
  LeadSearchResult,
  BusinessType,
  LeadSource,
  LeadStage,
  LeadStatus,
  Priority
} from './unified-lead';

// Extended Lead interface with additional fields for UI and compatibility
export interface ExtendedLead extends MetaLeadAdsModel {
  id: string; // Firestore document ID
  uid: string; // User ID - derived from context
  organizationId: string; // Organization ID - derived from context
  stage: 'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta Enviada' | 'Negociación' | 'Ganado' | 'Perdido' | 'Prospecto' | 'Interesado' | 'Propuesta' | 'Vendido';
  source: string; // Derived from lead data analysis
  images?: LeadImage[];
  featured_image_url?: string; // Denormalized for quick display
  
  // AI Content Cache
  aiContent?: import('./ai-content-cache').AIContentCache;
  aiCacheStats?: import('./ai-content-cache').CacheStats;
  
  // Computed/derived fields for backward compatibility
  name: string; // Maps to fullName
  email: string; // Direct mapping
  phone: string; // Maps to phoneNumber
  company: string; // Maps to companyName
  address?: string; // Derived from homeListing or other sources
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

// Tracking Links Types
export interface TrackingLink {
  id: string;
  leadId: string;
  organizationId: string;
  type: 'catalogo' | 'landing' | 'producto' | 'servicio';
  title: string;
  destinationUrl: string;
  campaignName: string;
  trackingUrl: string;
  createdAt: Timestamp | string;
  createdBy: string;
  clickCount: number;
  lastClickAt: Timestamp | string | null;
  isActive: boolean;
  metadata: {
    source?: string;
    leadName?: string;
    businessType?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface TrackingClick {
  id?: string;
  trackingId: string;
  leadId: string;
  organizationId: string;
  timestamp: Timestamp | string;
  clickData: {
    timestamp: string;
    userAgent: string;
    referrer: string;
    screenResolution: string;
    language: string;
    ipAddress: string;
    country?: string;
  };
}

export interface TrackingAnalytics {
  linkDetails: {
    id: string;
    title: string;
    type: string;
    destinationUrl: string;
    clickCount: number;
    createdAt: Timestamp | string;
    lastClickAt: Timestamp | string | null;
  };
  clicks: TrackingClick[];
  analytics: {
    clicksByHour: { [hour: string]: number };
    clicksByDay: { [day: string]: number };
    deviceTypes: { [device: string]: number };
    browsers: { [browser: string]: number };
    countries: { [country: string]: number };
    referrers: { [referrer: string]: number };
  };
}

// QR Tracking Links Types
export interface QRTrackingLink {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  publicUrlId: string; // Short cryptographically secure ID for public URLs
  scanCount: number;
  submissionCount: number;
  isActive: boolean;
  createdAt: Timestamp | string;
  createdBy: string;
  updatedAt: Timestamp | string;
  metadata: {
    qrCodeDataUrl?: string; // Base64 encoded QR code image
    targetAudience?: string;
    expectedLeads?: number;
    notes?: string;
  };
}

export interface QRPublicLead {
  id: string;
  leadData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  };
  status: 'pending_promotion' | 'promoted';
  createdAt: Timestamp | string;
  ipAddress: string;
  userAgent: string;
  metadata: {
    deviceType?: string;
    browser?: string;
    country?: string;
    referrer?: string;
    promotedAt?: Timestamp | string;
    promotedBy?: string;
    promotedToLeadId?: string;
  };
}

export interface QRScanEvent {
  id?: string;
  publicUrlId: string;
  organizationId: string;
  timestamp: Timestamp | string;
  scanData: {
    ipAddress: string;
    userAgent: string;
    deviceType: string;
    browser: string;
    country?: string;
    referrer?: string;
  };
}

// WhatsApp Integration Types
export interface WhatsAppInstance {
  id: string;
  organizationId: string;
  instanceName: string;
  webhookUrl: string;
  apiKey: string;
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastStatusCheck: Timestamp | string;
  phoneNumber?: string;
  qrCode?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  createdBy: string;
  settings: {
    autoReply: boolean;
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: Array<{
        day: string;
        start: string;
        end: string;
        enabled: boolean;
      }>;
    };
    antiSpam: {
      enabled: boolean;
      cooldownMinutes: number;
      maxMessagesPerHour: number;
    };
  };
}

export interface WhatsAppConversation {
  id: string;
  organizationId: string;
  instanceId: string;
  leadId: string;
  contactNumber: string;
  contactName?: string;
  status: 'active' | 'archived' | 'blocked';
  lastMessageAt: Timestamp | string;
  messageCount: number;
  unreadCount: number;
  tags: string[];
  assignedTo?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  metadata: {
    firstContact: Timestamp | string;
    lastActivity: Timestamp | string;
    businessType?: string;
    leadStage?: string;
    customerSegment?: string;
  };
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  instanceId: string;
  messageId: string; // Evolution API message ID
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
  direction: 'inbound' | 'outbound';
  content: {
    text?: string;
    media?: {
      url: string;
      mimetype: string;
      filename?: string;
      caption?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    contact?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Timestamp | string;
  fromNumber: string;
  toNumber: string;
  isFromBot: boolean;
  replyToMessageId?: string;
  createdAt: Timestamp | string;
  metadata: {
    campaignId?: string;
    templateName?: string;
    userAgent?: string;
    ipAddress?: string;
    deliveredAt?: Timestamp | string;
    readAt?: Timestamp | string;
    failureReason?: string;
  };
}

export interface WhatsAppCooldown {
  id: string;
  organizationId: string;
  contactNumber: string;
  instanceId: string;
  lastMessageAt: Timestamp | string;
  messageCount: number;
  cooldownUntil: Timestamp | string;
  createdAt: Timestamp | string;
}

// Extend CommunicationRecord to support WhatsApp
export interface CommunicationRecord {
  id: string;
  leadId: string;
  organizationId: string;
  type: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'note';
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Timestamp | string;
  createdBy: string;
  metadata: {
    // Email specific
    subject?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    
    // Phone specific
    duration?: number;
    
    // WhatsApp specific
    whatsappMessageId?: string;
    whatsappInstanceId?: string;
    whatsappConversationId?: string;
    messageType?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
    
    // Common
    attachments?: Array<{
      filename: string;
      url: string;
      mimetype: string;
    }>;
    tags?: string[];
    isAutomated?: boolean;
    campaignId?: string;
    templateName?: string;
  };
}
