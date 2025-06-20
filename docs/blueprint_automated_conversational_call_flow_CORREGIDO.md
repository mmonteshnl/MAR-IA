# Blueprint: Flujo de Llamadas Conversacionales Automatizadas - ACTUALIZADO

- **Versión:** 2.0 (Corregida)
- **Fecha:** 20 de Junio, 2025
- **Objetivo:** Integrar ElevenLabs Conversational AI 2.0 para llamadas automáticas a nuevos leads
- **Estado:** Análisis completado - Listo para implementación incremental

---

## 1. Estado Actual del Sistema

### ✅ **Componentes Ya Implementados**

1. **Sistema CONEX Completo**
   - FlowExecutor funcional en `src/lib/flow-executor.ts`
   - 8 tipos de nodos existentes (ApiCall, DataFetcher, HttpRequest, etc.)
   - Sistema de templating con Handlebars
   - Ejecución de flujos con contexto persistente

2. **Gestión de Leads Unificada**
   - Estructura `UnifiedLead` completa
   - Interface `CommunicationRecord` que soporta llamadas de voz
   - Sistema de stages y seguimiento
   - Integración multi-fuente (Meta Ads, Google Places, CSV/XML)

3. **Infraestructura Firebase**
   - Firebase Admin configurado
   - Colecciones bien estructuradas
   - Sistema de organizaciones multi-tenant

4. **Patrones de Comunicación**
   - Integración completa WhatsApp (Evolution API)
   - Sistema de webhooks establecido
   - Gestión de historial de comunicaciones

### ❌ **Componentes Por Implementar**

1. **Nodo ConversationalAICall** - No existe
2. **Cliente API ElevenLabs** - No implementado
3. **Webhooks ElevenLabs** - No creados
4. **Función `updateLeadCommunicationHistory()`** - No existe

---

## 2. Plan de Implementación Incremental

### **Fase 1: Cliente API ElevenLabs**

**Archivo a crear:** `src/lib/elevenlabs-api.ts`

```typescript
// src/lib/elevenlabs-api.ts
interface ElevenLabsCallConfig {
  agentId: string;
  voiceId?: string;
  phoneNumber: string;
  instructions: string;
  webhookUrl: string;
  metadata?: Record<string, any>;
}

interface ElevenLabsCallResponse {
  call_id: string;
  status: string;
  estimated_duration?: number;
}

export class ElevenLabsAPI {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1/conversational';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY no configurada');
    }
  }

  async initiateCall(config: ElevenLabsCallConfig): Promise<ElevenLabsCallResponse> {
    const response = await fetch(`${this.baseUrl}/start-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        agent_id: config.agentId,
        voice_id: config.voiceId,
        to_number: config.phoneNumber,
        system_prompt: config.instructions,
        webhook_url: config.webhookUrl,
        metadata: config.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API Error [${response.status}]: ${error}`);
    }

    return response.json();
  }

  async getCallStatus(callId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo estado de llamada: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### **Fase 2: Nodo ConversationalAICall para CONEX**

**Directorio a crear:** `src/components/conex/nodes/ConversationalAICallNode/`

**1. Schema del nodo:** `schema.ts`
```typescript
// src/components/conex/nodes/ConversationalAICallNode/schema.ts
import { z } from 'zod';

export const conversationalAICallNodeSchema = z.object({
  agentId: z.string().min(1, 'Agent ID requerido'),
  voiceId: z.string().optional(),
  phoneField: z.string().default('phone'),
  instructionsTemplate: z.string().min(1, 'Template de instrucciones requerido'),
  metadata: z.record(z.any()).optional(),
});

export type ConversationalAICallNodeConfig = z.infer<typeof conversationalAICallNodeSchema>;
```

**2. Configuración:** `constants.ts`
```typescript
// src/components/conex/nodes/ConversationalAICallNode/constants.ts
export const CONVERSATIONAL_AI_CALL_NODE = {
  type: 'conversationalAICall',
  label: 'Llamada IA Conversacional',
  description: 'Realiza llamadas automatizadas usando ElevenLabs',
  category: 'communication',
  inputs: ['trigger'],
  outputs: ['success', 'error'],
  icon: '📞',
  color: '#10B981',
};
```

**3. Ejecutor:** `runner.ts`
```typescript
// src/components/conex/nodes/ConversationalAICallNode/runner.ts
import { ElevenLabsAPI } from '@/lib/elevenlabs-api';
import type { FlowNode, FlowExecutionContext } from '@/types/conex';

export async function runConversationalAICallNode(
  node: FlowNode,
  context: FlowExecutionContext
): Promise<any> {
  const config = node.data.config;
  const { agentId, voiceId, phoneField, instructionsTemplate } = config;

  try {
    // Obtener datos del lead del contexto
    const leadData = context.variables.trigger?.input || {};
    const phoneNumber = leadData[phoneField];

    if (!phoneNumber) {
      throw new Error(`Campo de teléfono '${phoneField}' no encontrado en datos del lead`);
    }

    // Renderizar instrucciones con datos del lead
    const instructions = context.renderTemplate(instructionsTemplate, leadData);

    // Configurar webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/elevenlabs`;

    // Inicializar cliente ElevenLabs
    const elevenlabs = new ElevenLabsAPI();

    // Realizar llamada
    const result = await elevenlabs.initiateCall({
      agentId,
      voiceId,
      phoneNumber,
      instructions,
      webhookUrl,
      metadata: {
        leadId: leadData.id,
        organizationId: leadData.organizationId,
        flowExecutionId: context.executionId,
      },
    });

    return {
      success: true,
      data: {
        callId: result.call_id,
        status: result.status,
        phoneNumber: phoneNumber,
      },
    };

  } catch (error) {
    console.error('Error en nodo ConversationalAICall:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### **Fase 3: Webhook ElevenLabs**

**Archivo a crear:** `src/app/api/webhooks/elevenlabs/route.ts`

```typescript
// src/app/api/webhooks/elevenlabs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateLeadCommunicationHistory } from '@/lib/leads-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_id, status, transcript, duration_seconds, metadata } = body;

    if (!metadata?.leadId) {
      console.error('Webhook ElevenLabs sin leadId en metadata');
      return NextResponse.json({ error: 'leadId requerido' }, { status: 400 });
    }

    console.log(`Webhook ElevenLabs - Lead: ${metadata.leadId}, Call: ${call_id}, Estado: ${status}`);

    // Actualizar historial del lead
    await updateLeadCommunicationHistory(metadata.leadId, {
      type: 'AI_CONVERSATIONAL_CALL',
      provider: 'ElevenLabs',
      status: status,
      timestamp: new Date(),
      duration: duration_seconds,
      transcript: transcript,
      externalId: call_id,
      metadata: {
        organizationId: metadata.organizationId,
        flowExecutionId: metadata.flowExecutionId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error procesando webhook ElevenLabs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### **Fase 4: Función de Historial de Comunicaciones**

**Modificar:** `src/lib/leads-utils.ts`

```typescript
// Agregar a src/lib/leads-utils.ts
interface CommunicationHistoryEntry {
  type: 'AI_CONVERSATIONAL_CALL' | 'WHATSAPP_MESSAGE' | 'EMAIL' | 'SMS';
  provider: string;
  status: string;
  timestamp: Date;
  duration?: number;
  transcript?: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

export async function updateLeadCommunicationHistory(
  leadId: string,
  entry: CommunicationHistoryEntry
): Promise<void> {
  try {
    const leadRef = db.collection('leads-unified').doc(leadId);
    
    await leadRef.update({
      communicationHistory: firestore.FieldValue.arrayUnion({
        ...entry,
        timestamp: firestore.Timestamp.fromDate(entry.timestamp),
        id: generateId(), // Función para generar ID único
      }),
      lastCommunication: firestore.Timestamp.fromDate(entry.timestamp),
      updatedAt: firestore.Timestamp.now(),
    });

  } catch (error) {
    console.error('Error actualizando historial de comunicación:', error);
    throw error;
  }
}
```

### **Fase 5: Integración con FlowExecutor**

**Modificar:** `src/lib/flow-executor.ts`

```typescript
// Agregar al switch statement en executeNode()
case 'conversationalAICall':
  return this.executeConversationalAICallNode(node);

// Agregar método al final de la clase
private async executeConversationalAICallNode(node: FlowNode): Promise<any> {
  return runConversationalAICallNode(node, this.context);
}
```

---

## 3. Variables de Entorno Requeridas

**Agregar a `.env.local`:**
```env
# ElevenLabs Conversational AI
ELEVENLABS_API_KEY=tu_api_key_aqui
ELEVENLABS_DEFAULT_AGENT_ID=tu_agent_id_por_defecto
ELEVENLABS_DEFAULT_VOICE_ID=tu_voice_id_por_defecto

# URLs base para webhooks
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

---

## 4. Plan de Testing

### **Testing Unitario**
1. Probar cliente ElevenLabs API con datos mockeados
2. Validar ejecución del nodo ConversationalAICall
3. Probar webhook con payloads simulados

### **Testing de Integración**
1. Crear flujo CONEX con el nuevo nodo
2. Ejecutar flujo con lead de prueba
3. Verificar llamada real (número de prueba)
4. Confirmar recepción y procesamiento de webhook
5. Validar actualización del historial en Firestore

### **Testing End-to-End**
1. Crear lead → Activar flujo automático → Recibir llamada → Procesar resultado

---

## 5. Cronograma de Implementación

| Fase | Componente | Tiempo Estimado | Dependencias |
|------|------------|----------------|-------------|
| 1 | Cliente ElevenLabs API | 4-6 horas | API Key de ElevenLabs |
| 2 | Nodo ConversationalAICall | 6-8 horas | Fase 1 completa |
| 3 | Webhook Handler | 3-4 horas | Estructura de datos definida |
| 4 | Función updateLeadCommunicationHistory | 2-3 horas | Schema de historial |
| 5 | Integración FlowExecutor | 1-2 horas | Todas las fases anteriores |
| 6 | Testing y Debugging | 6-8 horas | Sistema completo |

**Total Estimado:** 22-31 horas

---

## 6. Consideraciones Técnicas

### **Limitaciones Identificadas**
- ElevenLabs API en versión beta - documentación puede cambiar
- Rate limits de la API por evaluar
- Costos por llamada a considerar

### **Arquitectura Aprovechada**
- Sistema CONEX existente es perfecto para esta integración
- Patrones de WhatsApp webhook aplicables directamente
- Estructura de leads ya soporta historial de comunicaciones

### **Próximos Pasos Recomendados**
1. Obtener API Key de ElevenLabs y documentación actualizada
2. Comenzar con Fase 1 (Cliente API)
3. Crear flujo de prueba simple en CONEX
4. Iterar con testing continuo

---

**Nota:** Este blueprint corregido refleja el estado actual del código y proporciona un plan realista de implementación incremental aprovechando la arquitectura existente.