// src/lib/email-service.ts
import { Resend } from 'resend';

// 1. Inicializar el cliente una sola vez
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  // Podríamos añadir 'react' para plantillas de React Email en el futuro
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un correo electrónico utilizando el proveedor configurado (Resend).
 * @param params - Los parámetros del correo a enviar.
 * @returns El resultado de la operación de envío.
 */
async function sendEmail(params: EmailParams): Promise<EmailResult> {
  try {
    // Validar que tenemos la API key
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }

    // Convertir 'to' a array si es string
    const toArray = Array.isArray(params.to) ? params.to : [params.to];
    
    // Validar formato de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of toArray) {
      if (!emailRegex.test(email.trim())) {
        throw new Error(`Email inválido: ${email}`);
      }
    }

    const { data, error } = await resend.emails.send({
      from: params.from,
      to: toArray,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("Error al enviar email con Resend:", error);
      throw new Error(`Resend API Error: ${error.message}`);
    }

    console.log(`Correo enviado exitosamente. Message ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error("Fallo catastrófico en el servicio de correo:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Valida si el servicio de correo está configurado correctamente
 */
function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Obtiene información de configuración para debugging
 */
function getConfigInfo() {
  return {
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
    isProduction: process.env.NODE_ENV === 'production'
  };
}

// 2. Exportar como un servicio
export const EmailService = {
  send: sendEmail,
  isConfigured,
  getConfigInfo,
  // Podríamos añadir más métodos en el futuro, como:
  // sendTransactional: (template, data) => { ... }
  // sendCampaign: (audienceId, campaignId) => { ... }
};

// Exportar tipos para uso externo
export type { EmailParams, EmailResult };