// File: LeadModel.ts

export interface MetaLeadAdsModel {
  adName: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  companyName: string;
  customDisclaimerResponses: string;
  dateCreated: string;
  email: string;
  formId: string;
  fullName: string;
  homeListing: string;
  isOrganic: string;
  leadId: string;
  partnerName: string;
  phoneNumber: string;
  platformId: string;
  retailerItemId: string;
  updatedAt: string;
  vehicle: string;
  visitRequest: string;
  // Additional properties for Lead compatibility
  phone?: string;
  address?: string;
  website?: string;
  businessType?: string;
  stage?: string;
}
