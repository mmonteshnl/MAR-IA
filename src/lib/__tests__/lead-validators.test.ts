import {
  validateUnifiedLead,
  validateCreateLeadInput,
  validateUpdateLeadInput,
  validateEmail,
  validatePhone,
  validateUrl,
  UnifiedLeadValidator,
  CreateLeadInputValidator,
  UpdateLeadInputValidator,
  LeadFiltersValidator,
  LeadBulkOperationValidator
} from '../lead-validators';

import { DataSource } from '@/types/data-sources';
import type { UnifiedLead } from '@/types/unified-lead';
import { Priority } from '@/types/unified-lead';

describe('Lead Validators', () => {
  const validUnifiedLead: UnifiedLead = {
    id: 'lead_123',
    name: 'Test Company',
    email: 'test@company.com',
    phone: '+15551234567',
    address: {
      street: '123 Main St',
      city: 'City',
      state: 'State',
      postalCode: '12345',
      country: 'Country'
    },
    source: DataSource.META_ADS,
    stage: 'Nuevo',
    businessType: 'Technology',
    businessName: 'Test Business Inc',
    organizationId: 'org_123',
    uid: 'user_123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    placeId: 'place_123',
    notes: 'Test notes',
    priority: Priority.HIGH,
    tags: ['tech', 'startup'],
    customFields: { industry: 'software' },
    transferredToFlow: false,
    isArchived: false
  };

  describe('Field Validators', () => {
    describe('validateEmail', () => {
      it('should validate correct email formats', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
        expect(validateEmail('user123@test-domain.org')).toBe(true);
      });

      it('should reject invalid email formats', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('test..test@domain.com')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(validateEmail(null as any)).toBe(false);
        expect(validateEmail(undefined as any)).toBe(false);
        expect(validateEmail('   ')).toBe(false);
      });
    });

    describe('validatePhone', () => {
      it('should validate correct phone formats', () => {
        expect(validatePhone('+15551234567')).toBe(true);
        expect(validatePhone('+34666777888')).toBe(true);
        expect(validatePhone('+525512345678')).toBe(true);
        expect(validatePhone('5551234567')).toBe(true);
      });

      it('should reject invalid phone formats', () => {
        expect(validatePhone('123')).toBe(false);
        expect(validatePhone('abc-def-ghij')).toBe(false);
        expect(validatePhone('123-456-78901')).toBe(false); // Too long
        expect(validatePhone('')).toBe(false);
      });

      it('should handle formatted phone numbers', () => {
        expect(validatePhone('(555) 123-4567')).toBe(true);
        expect(validatePhone('555.123.4567')).toBe(true);
        expect(validatePhone('555 123 4567')).toBe(true);
      });
    });

    describe('validateUrl', () => {
      it('should validate correct URL formats', () => {
        expect(validateUrl('https://www.example.com')).toBe(true);
        expect(validateUrl('http://test.org')).toBe(true);
        expect(validateUrl('https://subdomain.domain.co.uk/path')).toBe(true);
      });

      it('should reject invalid URL formats', () => {
        expect(validateUrl('not-a-url')).toBe(false);
        expect(validateUrl('www.example.com')).toBe(false); // Missing protocol
        expect(validateUrl('https://')).toBe(false);
        expect(validateUrl('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(validateUrl('ftp://files.example.com')).toBe(true);
        expect(validateUrl('https://localhost:3000')).toBe(true);
        expect(validateUrl('https://192.168.1.1')).toBe(true);
      });
    });
  });

  describe('UnifiedLead Validation', () => {
    describe('validateUnifiedLead', () => {
      it('should validate a complete valid lead', () => {
        const result = validateUnifiedLead(validUnifiedLead);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validUnifiedLead);
      });

      it('should validate minimal required fields', () => {
        const minimalLead = {
          id: 'lead_minimal',
          name: 'Minimal Company',
          email: '',
          phone: '',
          address: '',
          source: DataSource.FILE_IMPORT,
          stage: 'Nuevo',
          businessType: 'Otros',
          businessName: '',
          organizationId: 'org_123',
          uid: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
          placeId: '',
          notes: '',
          website: '',
          priority: 'medium',
          tags: [],
          customFields: {},
          transferredToFlow: false,
          isArchived: false
        };

        const result = validateUnifiedLead(minimalLead);
        expect(result.success).toBe(true);
      });

      it('should reject leads with missing required fields', () => {
        const invalidLead = {
          // Missing id, organizationId, uid
          name: 'Test Company',
          source: DataSource.META_ADS,
          stage: 'Nuevo'
        };

        const result = validateUnifiedLead(invalidLead as any);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should validate business type enum', () => {
        const leadWithInvalidBusinessType = {
          ...validUnifiedLead,
          businessType: 'InvalidType'
        };

        const result = validateUnifiedLead(leadWithInvalidBusinessType);
        expect(result.success).toBe(false);
        expect(result.error?.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['businessType']
            })
          ])
        );
      });

      it('should validate stage enum', () => {
        const leadWithInvalidStage = {
          ...validUnifiedLead,
          stage: 'InvalidStage'
        };

        const result = validateUnifiedLead(leadWithInvalidStage as any);
        expect(result.success).toBe(false);
      });

      it('should validate source enum', () => {
        const leadWithInvalidSource = {
          ...validUnifiedLead,
          source: 'InvalidSource'
        };

        const result = validateUnifiedLead(leadWithInvalidSource as any);
        expect(result.success).toBe(false);
      });

      it('should validate priority enum', () => {
        const leadWithInvalidPriority = {
          ...validUnifiedLead,
          priority: 'InvalidPriority'
        };

        const result = validateUnifiedLead(leadWithInvalidPriority as any);
        expect(result.success).toBe(false);
      });

      it('should validate email format when provided', () => {
        const leadWithInvalidEmail = {
          ...validUnifiedLead,
          email: 'invalid-email'
        };

        const result = validateUnifiedLead(leadWithInvalidEmail);
        expect(result.success).toBe(false);
      });

      it('should validate URL format when provided', () => {
        const leadWithInvalidUrl = {
          ...validUnifiedLead,
          website: 'not-a-url'
        };

        const result = validateUnifiedLead(leadWithInvalidUrl);
        expect(result.success).toBe(false);
      });

      it('should validate tags array', () => {
        const leadWithInvalidTags = {
          ...validUnifiedLead,
          tags: 'not-an-array'
        };

        const result = validateUnifiedLead(leadWithInvalidTags as any);
        expect(result.success).toBe(false);
      });

      it('should validate custom fields object', () => {
        const leadWithInvalidCustomFields = {
          ...validUnifiedLead,
          customFields: 'not-an-object'
        };

        const result = validateUnifiedLead(leadWithInvalidCustomFields as any);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Create Lead Input Validation', () => {
    const validCreateInput = {
      name: 'New Company',
      email: 'new@company.com',
      phone: '+15551234567',
      address: '456 New St',
      source: DataSource.FILE_IMPORT,
      businessType: 'Technology',
      businessName: 'New Business Inc',
      website: 'https://newcompany.com',
      notes: 'New lead notes',
      priority: 'high' as const,
      tags: ['new', 'potential'],
      customFields: { budget: '50000' }
    };

    it('should validate correct create input', () => {
      const result = validateCreateLeadInput(validCreateInput);
      expect(result.success).toBe(true);
    });

    it('should validate minimal create input', () => {
      const minimalInput = {
        name: 'Minimal Company',
        source: DataSource.MANUAL
      };

      const result = validateCreateLeadInput(minimalInput);
      expect(result.success).toBe(true);
    });

    it('should reject create input with invalid fields', () => {
      const invalidInput = {
        name: '', // Empty name should be invalid
        email: 'invalid-email',
        source: 'InvalidSource'
      };

      const result = validateCreateLeadInput(invalidInput as any);
      expect(result.success).toBe(false);
    });
  });

  describe('Update Lead Input Validation', () => {
    const validUpdateInput = {
      name: 'Updated Company',
      stage: 'Contactado' as const,
      priority: 'medium' as const,
      tags: ['updated'],
      notes: 'Updated notes'
    };

    it('should validate correct update input', () => {
      const result = validateUpdateLeadInput(validUpdateInput);
      expect(result.success).toBe(true);
    });

    it('should validate partial updates', () => {
      const partialUpdate = {
        stage: 'Calificado' as const
      };

      const result = validateUpdateLeadInput(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject update with invalid fields', () => {
      const invalidUpdate = {
        stage: 'InvalidStage',
        email: 'invalid-email'
      };

      const result = validateUpdateLeadInput(invalidUpdate as any);
      expect(result.success).toBe(false);
    });

    it('should not allow updating immutable fields', () => {
      const updateWithImmutableFields = {
        id: 'new-id', // Should not be updatable
        organizationId: 'new-org', // Should not be updatable
        uid: 'new-user', // Should not be updatable
        createdAt: new Date() // Should not be updatable
      };

      const result = validateUpdateLeadInput(updateWithImmutableFields as any);
      // This should either fail or strip out the immutable fields
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('id');
        expect(result.data).not.toHaveProperty('organizationId');
        expect(result.data).not.toHaveProperty('uid');
        expect(result.data).not.toHaveProperty('createdAt');
      }
    });
  });

  describe('Schema Validators', () => {
    it('should validate UnifiedLeadValidator schema', () => {
      const result = UnifiedLeadValidator.safeParse(validUnifiedLead);
      expect(result.success).toBe(true);
    });

    it('should validate CreateLeadInputValidator schema', () => {
      const createInput = {
        name: 'Test Company',
        source: DataSource.FILE_IMPORT
      };

      const result = CreateLeadInputValidator.safeParse(createInput);
      expect(result.success).toBe(true);
    });

    it('should validate UpdateLeadInputValidator schema', () => {
      const updateInput = {
        name: 'Updated Company',
        stage: 'Contactado'
      };

      const result = UpdateLeadInputValidator.safeParse(updateInput);
      expect(result.success).toBe(true);
    });

    it('should validate LeadFiltersValidator schema', () => {
      const filters = {
        stage: 'Nuevo',
        source: DataSource.META_ADS,
        businessType: 'Technology',
        priority: 'high',
        search: 'test company',
        tags: ['tech'],
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      };

      const result = LeadFiltersValidator.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should validate LeadBulkOperationValidator schema', () => {
      const bulkOperation = {
        leadIds: ['lead_1', 'lead_2', 'lead_3'],
        action: 'updateStage',
        data: {
          stage: 'Contactado'
        }
      };

      const result = LeadBulkOperationValidator.safeParse(bulkOperation);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined inputs', () => {
      expect(validateUnifiedLead(null as any).success).toBe(false);
      expect(validateUnifiedLead(undefined as any).success).toBe(false);
      expect(validateCreateLeadInput(null as any).success).toBe(false);
      expect(validateUpdateLeadInput(null as any).success).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(validateUnifiedLead({} as any).success).toBe(false);
      expect(validateCreateLeadInput({} as any).success).toBe(false);
      expect(validateUpdateLeadInput({}).success).toBe(true); // Empty updates should be valid
    });

    it('should provide detailed error messages', () => {
      const invalidLead = {
        name: '',
        email: 'invalid-email',
        source: 'InvalidSource'
      };

      const result = validateUnifiedLead(invalidLead as any);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(expect.any(Number));
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it('should validate complex nested objects', () => {
      const leadWithComplexCustomFields = {
        ...validUnifiedLead,
        customFields: {
          nested: {
            value: 'test',
            number: 123,
            array: [1, 2, 3]
          },
          simpleValue: 'test'
        }
      };

      const result = validateUnifiedLead(leadWithComplexCustomFields);
      expect(result.success).toBe(true);
    });
  });
});