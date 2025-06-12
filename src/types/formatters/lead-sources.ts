export enum LeadSource {
  META_ADS = 'meta_ads',
  GOOGLE_PLACES = 'google_places',
  XML_IMPORT = 'xml_import',
  CSV_IMPORT = 'csv_import',
  MANUAL = 'manual'
}

export const LEAD_SOURCE_COLORS = {
  [LeadSource.META_ADS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [LeadSource.GOOGLE_PLACES]: 'bg-green-100 text-green-800 border-green-200',
  [LeadSource.XML_IMPORT]: 'bg-purple-100 text-purple-800 border-purple-200',
  [LeadSource.CSV_IMPORT]: 'bg-orange-100 text-orange-800 border-orange-200',
  [LeadSource.MANUAL]: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

export const LEAD_SOURCE_LABELS = {
  [LeadSource.META_ADS]: 'Meta Ads',
  [LeadSource.GOOGLE_PLACES]: 'Google Places',
  [LeadSource.XML_IMPORT]: 'XML Import',
  [LeadSource.CSV_IMPORT]: 'CSV Import',
  [LeadSource.MANUAL]: 'Manual'
} as const;

export function getLeadSourceFromString(source: string): LeadSource {
  switch (source) {
    case 'meta_lead_ads':
    case 'facebook_ads':
    case 'instagram_ads':
      return LeadSource.META_ADS;
    case 'google_places':
    case 'google_places_search':
    case 'google_places_search_local_fallback':
      return LeadSource.GOOGLE_PLACES;
    case 'xml_import_ia':
      return LeadSource.XML_IMPORT;
    case 'csv_import_ia':
      return LeadSource.CSV_IMPORT;
    default:
      return LeadSource.MANUAL;
  }
}