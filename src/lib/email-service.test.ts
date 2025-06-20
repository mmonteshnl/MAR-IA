// src/lib/email-service.test.ts

// Mock environment variables first
const originalEnv = process.env;

// Mock Resend
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend
    }
  }))
}));

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.RESEND_API_KEY = 'test-api-key-123';
  mockSend.mockClear();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EmailService', () => {
  describe('send()', () => {
    it('should send email successfully with valid parameters', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        data: { id: 'test-message-id-123' },
        error: null
      });

      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(result.error).toBeUndefined();
      
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      });
    });

    it('should handle multiple recipients (array)', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        data: { id: 'test-message-id-456' },
        error: null
      });

      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'test@example.com',
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      });
    });

    it('should handle Resend API errors', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' }
      });
      
      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resend API Error: Invalid API key');
      expect(result.messageId).toBeUndefined();
    });

    it('should handle network/connection errors', async () => {
      // Arrange
      mockSend.mockRejectedValue(new Error('Network error'));
      
      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.messageId).toBeUndefined();
    });

    it('should validate email format', async () => {
      // Arrange
      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'invalid-email',
        to: 'also-invalid-email',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email inválido');
    });

    it('should fail when RESEND_API_KEY is not set', async () => {
      // Arrange
      delete process.env.RESEND_API_KEY;
      const { EmailService } = require('./email-service');

      const emailParams = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      };

      // Act
      const result = await EmailService.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('RESEND_API_KEY no está configurada');
    });
  });

  describe('isConfigured()', () => {
    it('should return true when API key is set', () => {
      process.env.RESEND_API_KEY = 'test-key';
      const { EmailService } = require('./email-service');
      expect(EmailService.isConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.RESEND_API_KEY;
      const { EmailService } = require('./email-service');
      expect(EmailService.isConfigured()).toBe(false);
    });
  });

  describe('getConfigInfo()', () => {
    it('should return configuration information', () => {
      process.env.RESEND_API_KEY = 'test-key-123';
      process.env.NODE_ENV = 'development';
      const { EmailService } = require('./email-service');

      const config = EmailService.getConfigInfo();

      expect(config.hasApiKey).toBe(true);
      expect(config.apiKeyLength).toBe(12);
      expect(config.isProduction).toBe(false);
    });

    it('should handle missing API key', () => {
      delete process.env.RESEND_API_KEY;
      const { EmailService } = require('./email-service');

      const config = EmailService.getConfigInfo();

      expect(config.hasApiKey).toBe(false);
      expect(config.apiKeyLength).toBe(0);
    });
  });
});