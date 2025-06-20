import {
  mapMetaLeadToUnified,
  mapExtendedLeadToUnified,
  mapLeadsFlowToUnified,
  mapUnifiedToExtended,
  createUnifiedLeadFromSource,
  mapMultipleMetaLeadsToUnified,
  determineBusinessType,
  mapLeadStage,
  mapLeadSource,
  cleanString,
  cleanNumber,
  parseDate
} from '../lead-mappers';

import { DataSource } from '@/types/data-sources';
import type { MetaLeadAd } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';
import type { UnifiedLead } from '@/types/unified-lead';

// Mock the validators module
jest.mock('../lead-validators', () => ({
  validateUnifiedLead: jest.fn().mockReturnValue({ success: true, data: {} }),
  validateEmail: jest.fn().mockReturnValue(true),
  validatePhone: jest.fn().mockReturnValue(true)
}));

describe('Lead Mappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Functions', () => {
    describe('cleanString', () => {
      it('should clean and trim strings properly', () => {
        expect(cleanString('  Hello World  ')).toBe('Hello World');
        expect(cleanString(null)).toBe('');
        expect(cleanString(undefined)).toBe('');
        expect(cleanString('')).toBe('');
        expect(cleanString('Test\nNew\tLine')).toBe('Test New Line');
      });

      it('should handle special characters', () => {
        expect(cleanString('José María')).toBe('José María');
        expect(cleanString('Company & Co.')).toBe('Company & Co.');
      });
    });

    describe('cleanNumber', () => {
      it('should clean phone numbers correctly', () => {
        expect(cleanNumber('+1 (555) 123-4567')).toBe('+15551234567');
        expect(cleanNumber('555.123.4567')).toBe('5551234567');
        expect(cleanNumber('555 123 4567')).toBe('5551234567');
        expect(cleanNumber('')).toBe('');
        expect(cleanNumber(null)).toBe('');
      });

      it('should preserve international formats', () => {
        expect(cleanNumber('+34 666 777 888')).toBe('+34666777888');
        expect(cleanNumber('+52 55 1234 5678')).toBe('+525512345678');
      });
    });

    describe('parseDate', () => {
      it('should parse various date formats', () => {
        const testDate = '2024-01-15';
        const result = parseDate(testDate);
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2024);
        expect(result?.getMonth()).toBe(0); // January is 0
        expect(result?.getDate()).toBe(15);
      });

      it('should handle invalid dates', () => {
        expect(parseDate('invalid-date')).toBeNull();
        expect(parseDate('')).toBeNull();
        expect(parseDate(null)).toBeNull();
        expect(parseDate(undefined)).toBeNull();
      });

      it('should handle timestamps', () => {
        const timestamp = Date.now();
        const result = parseDate(timestamp.toString());
        expect(result).toBeInstanceOf(Date);
      });
    });

    describe('determineBusinessType', () => {
      it('should determine business type from company name', () => {
        expect(determineBusinessType('Tech Solutions Inc')).toBe('Tecnología');
        expect(determineBusinessType('Medical Center')).toBe('Salud');
        expect(determineBusinessType('Restaurant La Casa')).toBe('Restaurantes');
        expect(determineBusinessType('Construction Co')).toBe('Construcción');
        expect(determineBusinessType('Generic Business')).toBe('Otros');
      });

      it('should handle empty or null values', () => {
        expect(determineBusinessType('')).toBe('Otros');
        expect(determineBusinessType(null)).toBe('Otros');
        expect(determineBusinessType(undefined)).toBe('Otros');
      });
    });

    describe('mapLeadStage', () => {
      it('should map common stage values', () => {
        expect(mapLeadStage('new')).toBe('Nuevo');
        expect(mapLeadStage('contacted')).toBe('Contactado');
        expect(mapLeadStage('qualified')).toBe('Calificado');
        expect(mapLeadStage('proposal')).toBe('Propuesta Enviada');
        expect(mapLeadStage('won')).toBe('Ganado');
        expect(mapLeadStage('lost')).toBe('Perdido');
      });

      it('should default to Nuevo for unknown stages', () => {
        expect(mapLeadStage('unknown')).toBe('Nuevo');
        expect(mapLeadStage('')).toBe('Nuevo');
        expect(mapLeadStage(null)).toBe('Nuevo');
      });
    });

    describe('mapLeadSource', () => {
      it('should map source values correctly', () => {
        expect(mapLeadSource('facebook')).toBe('Facebook');
        expect(mapLeadSource('meta-ads')).toBe('Meta Ads');
        expect(mapLeadSource('google')).toBe('Google');
        expect(mapLeadSource('website')).toBe('Website');
        expect(mapLeadSource('unknown')).toBe('Otros');
      });
    });
  });

  describe('Meta Lead Mapping', () => {
    const mockMetaLead: MetaLeadAd = {
      id: 'meta_123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555 123 4567',
      businessName: 'Doe Enterprises',
      address: '123 Main St, City, State',
      organizationId: 'org_123',
      uid: 'user_123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should map meta lead to unified format correctly', () => {
      const result = mapMetaLeadToUnified(mockMetaLead);

      expect(result).toMatchObject({
        id: 'meta_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+15551234567',
        businessName: 'Doe Enterprises',
        address: '123 Main St, City, State',
        source: DataSource.META_ADS,
        stage: 'Nuevo',
        businessType: expect.any(String),
        organizationId: 'org_123',
        uid: 'user_123'
      });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
      const minimalLead: Partial<MetaLeadAd> = {
        id: 'meta_456',
        name: 'Jane Smith',
        organizationId: 'org_123',
        uid: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = mapMetaLeadToUnified(minimalLead as MetaLeadAd);

      expect(result.id).toBe('meta_456');
      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('');
      expect(result.phone).toBe('');
      expect(result.source).toBe(DataSource.META_ADS);
    });

    it('should handle bulk mapping with error recovery', () => {
      const leads = [
        mockMetaLead,
        { ...mockMetaLead, id: 'meta_456', name: 'Jane Smith' },
        null as any, // Invalid lead
        { ...mockMetaLead, id: 'meta_789', name: 'Bob Johnson' }
      ];

      const results = mapMultipleMetaLeadsToUnified(leads);

      expect(results).toHaveLength(3); // Should skip null lead
      expect(results[0].id).toBe('meta_123');
      expect(results[1].id).toBe('meta_456');
      expect(results[2].id).toBe('meta_789');
    });
  });

  describe('Extended Lead Mapping', () => {
    const mockExtendedLead: ExtendedLead = {
      id: 'ext_123',
      uid: 'user_123',
      name: 'Company ABC',
      address: '456 Business Ave',
      stage: 'Contactado',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      placeId: 'place_123',
      source: 'Google Places',
      organizationId: 'org_123',
      email: 'contact@company.com',
      phone: '+1-555-987-6543',
      website: 'https://company.com',
      businessType: 'Technology'
    };

    it('should map extended lead to unified format', () => {
      const result = mapExtendedLeadToUnified(mockExtendedLead);

      expect(result).toMatchObject({
        id: 'ext_123',
        name: 'Company ABC',
        email: 'contact@company.com',
        phone: '+15559876543',
        address: '456 Business Ave',
        stage: 'Contactado',
        source: DataSource.GOOGLE_PLACES,
        businessType: 'Technology',
        organizationId: 'org_123',
        uid: 'user_123',
        placeId: 'place_123',
        website: 'https://company.com'
      });
    });

    it('should handle reverse mapping to extended format', () => {
      const unifiedLead: UnifiedLead = {
        id: 'unified_123',
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+15551234567',
        address: '789 Test St',
        source: DataSource.FILE_IMPORT,
        stage: 'Calificado',
        businessType: 'Services',
        organizationId: 'org_123',
        uid: 'user_123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        placeId: '',
        businessName: '',
        notes: '',
        website: '',
        priority: 'medium',
        tags: [],
        customFields: {},
        transferredToFlow: false,
        isArchived: false
      };

      const result = mapUnifiedToExtended(unifiedLead);

      expect(result).toMatchObject({
        id: 'unified_123',
        name: 'Test Company',
        address: '789 Test St',
        stage: 'Calificado',
        source: 'CSV Import',
        businessType: 'Services',
        organizationId: 'org_123',
        uid: 'user_123',
        email: 'test@company.com',
        phone: '+15551234567'
      });

      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });
  });

  describe('createUnifiedLeadFromSource', () => {
    it('should create unified lead with validation', () => {
      const sourceData = {
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '555-123-4567',
        businessName: 'Test Business'
      };

      const result = createUnifiedLeadFromSource(
        sourceData,
        DataSource.FILE_IMPORT,
        'org_123',
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '5551234567',
        businessName: 'Test Business',
        source: DataSource.FILE_IMPORT,
        stage: 'Nuevo',
        organizationId: 'org_123',
        uid: 'user_123'
      });
    });

    it('should handle validation errors', () => {
      // Mock validation failure
      const mockValidate = require('../lead-validators').validateUnifiedLead;
      mockValidate.mockReturnValueOnce({
        success: false,
        error: { errors: [{ message: 'Invalid email' }] }
      });

      const result = createUnifiedLeadFromSource(
        { name: '', email: 'invalid-email' },
        DataSource.FILE_IMPORT,
        'org_123',
        'user_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    it('should handle missing required fields', () => {
      const result = createUnifiedLeadFromSource(
        {},
        DataSource.FILE_IMPORT,
        'org_123',
        'user_123'
      );

      // Should still create a lead with defaults
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('');
      expect(result.data?.stage).toBe('Nuevo');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => mapMetaLeadToUnified(null as any)).not.toThrow();
      expect(() => mapExtendedLeadToUnified(undefined as any)).not.toThrow();
    });

    it('should handle malformed data', () => {
      const malformedLead = {
        id: 123, // Wrong type
        name: null,
        email: 'not-an-email',
        phone: 'abc-def-ghij',
        createdAt: 'invalid-date'
      };

      expect(() => mapMetaLeadToUnified(malformedLead as any)).not.toThrow();
    });

    it('should preserve important IDs and organizational data', () => {
      const lead = {
        id: 'important_id',
        organizationId: 'org_critical',
        uid: 'user_essential',
        name: 'Test'
      };

      const result = mapMetaLeadToUnified(lead as any);

      expect(result.id).toBe('important_id');
      expect(result.organizationId).toBe('org_critical');
      expect(result.uid).toBe('user_essential');
    });
  });
});