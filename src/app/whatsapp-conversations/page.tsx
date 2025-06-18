"use client";

import { WhatsAppConversations } from '@/components/whatsapp/WhatsAppConversations';
import { WhatsAppAlerts } from '@/components/whatsapp/WhatsAppAlerts';

export default function WhatsAppConversationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Conversaciones de WhatsApp
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona todas las conversaciones de WhatsApp con tus leads.
        </p>
      </div>
      
      {/* Alertas de estado */}
      <WhatsAppAlerts />
      
      {/* Conversaciones */}
      <WhatsAppConversations />
    </div>
  );
}