/**
 * Evolution API - Servicio para integración con WhatsApp
 * Extended for multi-instance management with CRM integration
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

class EvolutionAPIService {
  private config: EvolutionAPIConfig;
  private multiInstanceConfig?: MultiInstanceConfig;

  constructor(config?: Partial<EvolutionAPIConfig>, multiInstanceConfig?: MultiInstanceConfig) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.EVOLUTION_API_BASE_URL || 'http://localhost:8081',
      apiKey: config?.apiKey || process.env.EVOLUTION_API_KEY || 'evolution_api_key_2024',
      instance: config?.instance || process.env.EVOLUTION_API_INSTANCE || 'h',
    };
    this.multiInstanceConfig = multiInstanceConfig;
  }

  /**
   * Update multi-instance configuration
   */
  setMultiInstanceConfig(config: MultiInstanceConfig): void {
    this.multiInstanceConfig = config;
  }

  /**
   * Get instance configuration by ID
   */
  private getInstanceConfig(instanceId?: string): EvolutionAPIConfig | null {
    if (!this.multiInstanceConfig || !instanceId) {
      return this.config;
    }

    const instance = this.multiInstanceConfig.instances.find(i => i.id === instanceId);
    if (!instance) {
      return null;
    }

    // Extract base URL without instance path
    const webhookUrl = instance.webhookUrl;
    const baseUrl = webhookUrl.split('/instance/')[0] || this.config.baseUrl;

    return {
      baseUrl,
      apiKey: instance.apiKey,
      instance: instance.instanceName
    };
  }

  /**
   * Get default or specified instance config
   */
  private resolveInstanceConfig(instanceId?: string): EvolutionAPIConfig {
    if (instanceId) {
      const config = this.getInstanceConfig(instanceId);
      if (config) return config;
    }

    if (this.multiInstanceConfig?.defaultInstanceId) {
      const config = this.getInstanceConfig(this.multiInstanceConfig.defaultInstanceId);
      if (config) return config;
    }

    return this.config;
  }

  /**
   * Verificar el estado de la conexión de la instancia
   */
  async checkConnectionStatus(instanceId?: string): Promise<APIResponse> {
    try {
      const config = this.resolveInstanceConfig(instanceId);
      const response = await fetch(`${config.baseUrl}/instance/connectionState/${config.instance}`, {
        headers: {
          'apikey': config.apiKey
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const isConnected = result.instance?.state === 'open';
        return {
          success: isConnected,
          data: {
            state: result.instance?.state,
            connected: isConnected
          }
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al verificar estado de conexión'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendTextMessage(message: WhatsAppMessage, instanceId?: string): Promise<APIResponse> {
    try {
      const config = this.resolveInstanceConfig(instanceId);
      
      // Verificar conexión primero
      const connectionStatus = await this.checkConnectionStatus(instanceId);
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      // Limpiar y validar el número de teléfono
      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        text: message.text
      };

      const response = await fetch(`${config.baseUrl}/message/sendText/${config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar mensaje'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje con imagen
   */
  async sendMediaMessage(message: WhatsAppMediaMessage, instanceId?: string): Promise<APIResponse> {
    try {
      const config = this.resolveInstanceConfig(instanceId);
      
      const connectionStatus = await this.checkConnectionStatus(instanceId);
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        mediatype: message.mediatype,
        media: message.media,
        ...(message.caption && { caption: message.caption }),
        ...(message.fileName && { fileName: message.fileName })
      };

      const response = await fetch(`${config.baseUrl}/message/sendMedia/${config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar media'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar media: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje con botones
   */
  async sendButtonMessage(message: WhatsAppButtonMessage, instanceId?: string): Promise<APIResponse> {
    try {
      const config = this.resolveInstanceConfig(instanceId);
      
      const connectionStatus = await this.checkConnectionStatus(instanceId);
      if (!connectionStatus.success) {
        return {
          success: false,
          error: `WhatsApp no conectado: ${connectionStatus.error}`
        };
      }

      const cleanNumber = this.cleanPhoneNumber(message.number);
      if (!cleanNumber) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }

      const body = {
        number: cleanNumber,
        title: message.title,
        description: message.description,
        buttons: message.buttons
      };

      const response = await fetch(`${config.baseUrl}/message/sendButtons/${config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al enviar botones'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar botones: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Limpiar y formatear número de teléfono
   */
  private cleanPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remover todos los caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Validar que tenga al menos 10 dígitos
    if (cleanPhone.length < 10) return null;

    // Formatear según las reglas de la documentación
    let phoneNumber = cleanPhone;

    // Si tiene 10 dígitos y no empieza con 52 (México), agregar 52
    if (phoneNumber.length === 10 && !phoneNumber.startsWith('52')) {
      phoneNumber = '52' + phoneNumber;
    }
    // Si tiene 11 dígitos y empieza con 1 (Estados Unidos), mantener
    else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
      phoneNumber = phoneNumber;
    }
    // Si tiene 12 dígitos y empieza con 52 (México), mantener
    else if (phoneNumber.length === 12 && phoneNumber.startsWith('52')) {
      phoneNumber = phoneNumber;
    }

    return phoneNumber;
  }

  /**
   * Crear un mensaje de bienvenida personalizado
   */
  createWelcomeMessage(leadName: string, businessType?: string): WhatsAppButtonMessage {
    const greeting = businessType 
      ? `¡Hola ${leadName}! 👋\n\nVi que tienes un ${businessType} y me encantaría conocer más sobre tu negocio.`
      : `¡Hola ${leadName}! 👋\n\nMe encantaría conocer más sobre tu negocio.`;

    return {
      number: '', // Se asignará cuando se use
      title: "🎯 ¿En qué podemos ayudarte?",
      description: `${greeting}\n\n¿Te gustaría que conversemos sobre cómo podemos potenciar tu negocio?`,
      buttons: [
        {
          buttonId: "info_productos",
          buttonText: {
            displayText: "📋 Ver Productos"
          },
          type: "reply"
        },
        {
          buttonId: "agendar_cita",
          buttonText: {
            displayText: "📅 Agendar Cita"
          },
          type: "reply"
        },
        {
          buttonId: "mas_info",
          buttonText: {
            displayText: "💬 Más Información"
          },
          type: "reply"
        }
      ]
    };
  }

  /**
   * Check if contact is in cooldown period
   */
  async checkCooldown(
    organizationId: string,
    phone: string, 
    instanceId?: string
  ): Promise<{ inCooldown: boolean; remainingMinutes?: number; messageCount?: number }> {
    if (!this.multiInstanceConfig || !instanceId || !organizationId) {
      return { inCooldown: false };
    }

    const instance = this.multiInstanceConfig.instances.find(i => i.id === instanceId);
    if (!instance || !instance.settings.antiSpam.enabled) {
      return { inCooldown: false };
    }

    // Import cooldown service dynamically to avoid circular dependencies
    const { WhatsAppCooldownService } = await import('./whatsapp-cooldown');
    
    const cooldownCheck = await WhatsAppCooldownService.checkCooldown(
      organizationId,
      instanceId,
      this.cleanPhoneNumber(phone) || phone,
      instance.settings.antiSpam
    );

    return {
      inCooldown: cooldownCheck.inCooldown,
      remainingMinutes: cooldownCheck.remainingMinutes,
      messageCount: cooldownCheck.messageCount
    };
  }

  /**
   * Record message sent for cooldown tracking
   */
  async recordMessageSent(
    organizationId: string,
    phone: string,
    instanceId?: string
  ): Promise<void> {
    if (!this.multiInstanceConfig || !instanceId || !organizationId) {
      return;
    }

    const instance = this.multiInstanceConfig.instances.find(i => i.id === instanceId);
    if (!instance || !instance.settings.antiSpam.enabled) {
      return;
    }

    // Import cooldown service dynamically to avoid circular dependencies
    const { WhatsAppCooldownService } = await import('./whatsapp-cooldown');
    
    await WhatsAppCooldownService.recordMessageSent(
      organizationId,
      instanceId,
      this.cleanPhoneNumber(phone) || phone,
      instance.settings.antiSpam
    );
  }

  /**
   * Check if sending is allowed within business hours
   */
  async checkBusinessHours(instanceId?: string): Promise<{ allowed: boolean; nextAvailable?: Date }> {
    if (!this.multiInstanceConfig || !instanceId) {
      return { allowed: true };
    }

    const instance = this.multiInstanceConfig.instances.find(i => i.id === instanceId);
    if (!instance) {
      return { allowed: true };
    }

    // Import cooldown service dynamically to avoid circular dependencies
    const { WhatsAppCooldownService } = await import('./whatsapp-cooldown');
    
    const isWithinHours = WhatsAppCooldownService.isWithinBusinessHours(
      instance,
      instance.settings.businessHours.timezone
    );

    if (!isWithinHours) {
      const nextAvailable = WhatsAppCooldownService.getNextBusinessHour(
        instance,
        instance.settings.businessHours.timezone
      );
      return { allowed: false, nextAvailable: nextAvailable || undefined };
    }

    return { allowed: true };
  }

  /**
   * Create instance (for organization setup)
   */
  async createInstance(instanceName: string, webhookUrl?: string): Promise<APIResponse> {
    try {
      const body: any = {
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      if (webhookUrl) {
        body.webhook = webhookUrl;
      }

      const response = await fetch(`${this.config.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al crear instancia'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al crear instancia: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Get QR code for instance connection
   */
  async getQRCode(instanceName: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': this.config.apiKey
        }
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error al obtener QR'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener QR: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar mensaje de bienvenida automático
   */
  async sendWelcomeMessage(
    organizationId: string,
    phone: string, 
    leadName: string, 
    businessType?: string, 
    instanceId?: string
  ): Promise<APIResponse> {
    try {
      // Check business hours first
      const businessHoursCheck = await this.checkBusinessHours(instanceId);
      if (!businessHoursCheck.allowed) {
        const nextAvailable = businessHoursCheck.nextAvailable;
        const nextTime = nextAvailable 
          ? nextAvailable.toLocaleString('es-ES', { 
              weekday: 'long', 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : 'en horario de atención';
          
        return {
          success: false,
          error: `Fuera del horario de atención. Próximo envío disponible: ${nextTime}`
        };
      }

      // Check cooldown
      const cooldownCheck = await this.checkCooldown(organizationId, phone, instanceId);
      if (cooldownCheck.inCooldown) {
        return {
          success: false,
          error: `Contacto en período de enfriamiento. Espera ${cooldownCheck.remainingMinutes} minutos.`
        };
      }

      const welcomeMessage = this.createWelcomeMessage(leadName, businessType);
      welcomeMessage.number = phone;

      // Primero enviar un mensaje de texto simple
      const textResult = await this.sendTextMessage({
        number: phone,
        text: `¡Hola ${leadName}! 👋\n\nGracias por tu interés en nuestros servicios. Me encantaría conocer más sobre tu negocio y cómo podemos ayudarte a crecer. 🚀`
      }, instanceId);

      if (!textResult.success) {
        return textResult;
      }

      // Record message sent for cooldown tracking
      await this.recordMessageSent(organizationId, phone, instanceId);

      // Esperar un momento antes de enviar los botones
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Luego enviar el mensaje con botones
      const buttonResult = await this.sendButtonMessage(welcomeMessage, instanceId);
      
      // Record second message if successful
      if (buttonResult.success) {
        await this.recordMessageSent(organizationId, phone, instanceId);
      }
      
      return buttonResult;
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar mensaje de bienvenida: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}

// Instancia singleton
let evolutionAPI: EvolutionAPIService | null = null;

export function getEvolutionAPI(config?: Partial<EvolutionAPIConfig>, multiInstanceConfig?: MultiInstanceConfig): EvolutionAPIService {
  if (!evolutionAPI) {
    evolutionAPI = new EvolutionAPIService(config, multiInstanceConfig);
  } else if (multiInstanceConfig) {
    evolutionAPI.setMultiInstanceConfig(multiInstanceConfig);
  }
  return evolutionAPI;
}

export { EvolutionAPIService };
export type { 
  WhatsAppMessage, 
  WhatsAppMediaMessage, 
  WhatsAppButtonMessage, 
  APIResponse, 
  EvolutionAPIConfig,
  MultiInstanceConfig 
};