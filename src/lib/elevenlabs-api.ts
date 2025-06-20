// ElevenLabs Conversational AI Client
// Optimizado para integración con sistema CONEX

interface ElevenLabsCallConfig {
  agentId: string;
  voiceId?: string;
  phoneNumber: string;
  instructions: string;
  webhookUrl: string;
  metadata?: Record<string, any>;
  maxDuration?: number;
}

interface ElevenLabsCallResponse {
  call_id: string;
  status: 'initiated' | 'queued' | 'in_progress' | 'completed' | 'failed';
  estimated_duration?: number;
  message?: string;
}

interface ElevenLabsCallStatus {
  call_id: string;
  status: string;
  duration_seconds?: number;
  transcript?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export class ElevenLabsAPI {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1/conversational-ai';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY no configurada en variables de entorno');
    }
  }

  /**
   * Inicia una llamada conversacional automatizada
   */
  async initiateCall(config: ElevenLabsCallConfig): Promise<ElevenLabsCallResponse> {
    try {
      const payload = {
        agent_id: config.agentId,
        voice_id: config.voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID,
        phone_number: this.formatPhoneNumber(config.phoneNumber),
        system_prompt: config.instructions,
        webhook_url: config.webhookUrl,
        max_duration_seconds: config.maxDuration || 600, // 10 minutos por defecto
        metadata: {
          ...config.metadata,
          initiated_at: new Date().toISOString(),
          source: 'conex-flow',
        },
      };

      console.log('🔄 Iniciando llamada ElevenLabs:', {
        phone: this.maskPhoneNumber(config.phoneNumber),
        agentId: config.agentId,
        hasWebhook: !!config.webhookUrl,
      });

      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          'User-Agent': 'CRM-CONEX/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `ElevenLabs API Error [${response.status}]: ${
            errorData.message || response.statusText
          }`
        );
      }

      const result: ElevenLabsCallResponse = await response.json();
      
      console.log('✅ Llamada ElevenLabs iniciada:', {
        callId: result.call_id,
        status: result.status,
      });

      return result;

    } catch (error) {
      console.error('❌ Error iniciando llamada ElevenLabs:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de una llamada
   */
  async getCallStatus(callId: string): Promise<ElevenLabsCallStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        headers: {
          'xi-api-key': this.apiKey,
          'User-Agent': 'CRM-CONEX/1.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error obteniendo estado de llamada [${response.status}]: ${
            errorData.message || response.statusText
          }`
        );
      }

      return response.json();

    } catch (error) {
      console.error('❌ Error obteniendo estado de llamada:', error);
      throw error;
    }
  }

  /**
   * Cancela una llamada en progreso
   */
  async cancelCall(callId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/cancel`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'User-Agent': 'CRM-CONEX/1.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error cancelando llamada [${response.status}]: ${
            errorData.message || response.statusText
          }`
        );
      }

      console.log('🚫 Llamada cancelada:', callId);
      return true;

    } catch (error) {
      console.error('❌ Error cancelando llamada:', error);
      return false;
    }
  }

  /**
   * Lista llamadas recientes (para debugging)
   */
  async listRecentCalls(limit = 10): Promise<ElevenLabsCallStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/calls?limit=${limit}`, {
        headers: {
          'xi-api-key': this.apiKey,
          'User-Agent': 'CRM-CONEX/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Error listando llamadas: ${response.statusText}`);
      }

      const data = await response.json();
      return data.calls || [];

    } catch (error) {
      console.error('❌ Error listando llamadas:', error);
      return [];
    }
  }

  /**
   * Valida configuración de API
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`, {
        headers: {
          'xi-api-key': this.apiKey,
          'User-Agent': 'CRM-CONEX/1.0',
        },
      });

      return response.ok;

    } catch (error) {
      console.error('❌ Error validando configuración ElevenLabs:', error);
      return false;
    }
  }

  // Métodos utilitarios privados
  private formatPhoneNumber(phone: string): string {
    // Remover caracteres no numéricos excepto +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si no empieza con +, agregar código de país por defecto
    if (!cleaned.startsWith('+')) {
      // Asumir código +1 para números de 10 dígitos (US/Canada)
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }
      // Para otros casos, agregar + al inicio
      return `+${cleaned}`;
    }
    
    return cleaned;
  }

  private maskPhoneNumber(phone: string): string {
    const formatted = this.formatPhoneNumber(phone);
    if (formatted.length > 8) {
      return formatted.slice(0, -4) + '****';
    }
    return '****';
  }
}

// Singleton para uso global
let elevenLabsInstance: ElevenLabsAPI | null = null;

export function getElevenLabsClient(): ElevenLabsAPI {
  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsAPI();
  }
  return elevenLabsInstance;
}

// Funciones de utilidad para testing
export const ElevenLabsUtils = {
  /**
   * Valida si un número de teléfono es válido para llamadas
   */
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  /**
   * Genera webhook URL para el sistema
   */
  generateWebhookUrl(baseUrl: string, leadId?: string): string {
    const webhookPath = '/api/webhooks/elevenlabs';
    const url = new URL(webhookPath, baseUrl);
    
    if (leadId) {
      url.searchParams.set('leadId', leadId);
    }
    
    return url.toString();
  },

  /**
   * Valida configuración de ElevenLabs
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!process.env.ELEVENLABS_API_KEY) {
      errors.push('ELEVENLABS_API_KEY no configurada');
    }
    
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      errors.push('NEXT_PUBLIC_BASE_URL no configurada para webhooks');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};