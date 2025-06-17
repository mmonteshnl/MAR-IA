/**
 * Evolution API Client - Safe for client-side use
 * Cooldown logic moved to API routes
 */

import type { WhatsAppInstance } from '@/types';

interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

interface MultiInstanceConfig {
  instances: WhatsAppInstance[];
  defaultInstanceId?: string;
}

interface WhatsAppMessage {
  number: string;
  text: string;
}

interface WhatsAppMediaMessage {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  media: string;
  caption?: string;
  fileName?: string;
}

interface WhatsAppButtonMessage {
  number: string;
  title: string;
  description: string;
  buttons: Array<{
    buttonId: string;
    buttonText: {
      displayText: string;
    };
    type: 'reply';
  }>;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CooldownCheckResult {
  inCooldown: boolean;
  remainingMinutes?: number;
  messageCount?: number;
  nextAllowedAt?: Date;
}

/**
 * Client-safe Evolution API class
 * All server-side operations moved to API routes
 */
export class EvolutionAPIClient {
  private config: EvolutionAPIConfig;
  private multiInstanceConfig?: MultiInstanceConfig;

  constructor(config: EvolutionAPIConfig, multiInstanceConfig?: MultiInstanceConfig) {
    this.config = config;
    this.multiInstanceConfig = multiInstanceConfig;
  }

  /**
   * Check cooldown status via API route
   */
  async checkCooldown(
    organizationId: string,
    instanceId: string,
    contactNumber: string
  ): Promise<CooldownCheckResult> {
    try {
      const response = await fetch('/api/whatsapp/cooldown/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          instanceId,
          contactNumber,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check cooldown');
      }

      return result.data;
    } catch (error) {
      console.error('Error checking cooldown:', error);
      return { inCooldown: false };
    }
  }

  /**
   * Send message via API route (includes cooldown handling)
   */
  async sendMessage(
    organizationId: string,
    instanceId: string,
    message: WhatsAppMessage
  ): Promise<APIResponse> {
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          instanceId,
          message,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send media message via API route
   */
  async sendMedia(
    organizationId: string,
    instanceId: string,
    message: WhatsAppMediaMessage
  ): Promise<APIResponse> {
    try {
      const response = await fetch('/api/whatsapp/send-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          instanceId,
          message,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send media');
      }

      return result;
    } catch (error) {
      console.error('Error sending media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get instance status via API route
   */
  async getInstanceStatus(instanceId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/whatsapp/instance-status/${instanceId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get instance status');
      }

      return result;
    } catch (error) {
      console.error('Error getting instance status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all instances for organization via API route
   */
  async getInstances(organizationId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/whatsapp/instances?organizationId=${organizationId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get instances');
      }

      return result;
    } catch (error) {
      console.error('Error getting instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversations via API route
   */
  async getConversations(organizationId: string, instanceId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/whatsapp/conversations?organizationId=${organizationId}&instanceId=${instanceId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get conversations');
      }

      return result;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Factory function to create Evolution API client
 */
export function createEvolutionAPIClient(
  config: EvolutionAPIConfig,
  multiInstanceConfig?: MultiInstanceConfig
): EvolutionAPIClient {
  return new EvolutionAPIClient(config, multiInstanceConfig);
}

/**
 * Get Evolution API client instance (client-safe)
 */
export function getEvolutionAPIClient(): EvolutionAPIClient {
  const config: EvolutionAPIConfig = {
    baseUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '',
    instance: process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'default',
  };

  return createEvolutionAPIClient(config);
}