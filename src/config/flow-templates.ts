import type { FlowData } from '@/types/conex';
import { DataSource } from '@/types/data-sources';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'comunicacion' | 'notificaciones' | 'validacion' | 'integracion';
  difficulty: 'facil' | 'intermedio' | 'avanzado';
  estimatedTime: string;
  useCase: string;
  flowData: FlowData;
  requiredConnections?: string[];
  variables?: Record<string, any>;
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'whatsapp-welcome-meta',
    name: 'Bienvenida por WhatsApp a Leads de Meta',
    description: 'Envía automáticamente un mensaje de bienvenida por WhatsApp cuando se recibe un nuevo lead de Meta Ads.',
    category: 'comunicacion',
    difficulty: 'facil',
    estimatedTime: '5-10 minutos',
    useCase: 'Ideal para equipos que quieren dar una respuesta inmediata a leads de Meta Ads y aumentar las tasas de conversión inicial.',
    requiredConnections: ['whatsapp'],
    variables: {
      welcomeMessage: '¡Hola! Gracias por tu interés. Te contactaremos pronto para ayudarte con {{leadName}}.'
    },
    flowData: {
      nodes: [
        {
          id: 'trigger-meta-lead',
          type: 'trigger',
          position: { x: 50, y: 100 },
          data: {
            label: 'Nuevo Lead de Meta',
            config: {
              triggerType: 'webhook',
              eventSource: 'meta-ads',
              condition: 'lead.source === "META_ADS"'
            }
          }
        },
        {
          id: 'whatsapp-welcome',
          type: 'apiCall',
          position: { x: 350, y: 100 },
          data: {
            label: 'Enviar Mensaje WhatsApp',
            config: {
              method: 'POST',
              url: '/api/whatsapp/send-message',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone: '{{lead.phone}}',
                message: '¡Hola {{lead.name}}! 👋\\n\\nGracias por tu interés en nuestros servicios. Hemos recibido tu consulta y uno de nuestros especialistas se pondrá en contacto contigo muy pronto.\\n\\n¿Hay algún horario que prefieras para que te contactemos?',
                instanceId: '{{connections.whatsapp.instanceId}}'
              }),
              connectionId: 'whatsapp',
              successMessage: 'Mensaje de bienvenida enviado exitosamente',
              errorMessage: 'Error al enviar mensaje de WhatsApp'
            }
          }
        },
        {
          id: 'monitor-response',
          type: 'monitor',
          position: { x: 650, y: 100 },
          data: {
            label: 'Monitorear Resultado',
            config: {
              logLevel: 'info',
              trackEvents: ['message_sent', 'message_failed'],
              alertOnError: true,
              saveToDatabase: true
            }
          }
        }
      ],
      edges: [
        {
          id: 'trigger-to-whatsapp',
          source: 'trigger-meta-lead',
          target: 'whatsapp-welcome',
          type: 'default'
        },
        {
          id: 'whatsapp-to-monitor',
          source: 'whatsapp-welcome',
          target: 'monitor-response',
          type: 'default'
        }
      ]
    }
  },
  {
    id: 'slack-high-value-notification',
    name: 'Notificación Interna de Lead Calificado',
    description: 'Envía una notificación al equipo de ventas cuando un lead supera un valor específico o cumple criterios de alta prioridad.',
    category: 'notificaciones',
    difficulty: 'intermedio',
    estimatedTime: '10-15 minutos',
    useCase: 'Perfecto para equipos de ventas que necesitan atención inmediata en leads de alto valor para maximizar las oportunidades.',
    requiredConnections: ['slack', 'webhook'],
    variables: {
      minimumLeadValue: 5000,
      slackChannel: '#ventas-urgente',
      alertMessage: '🚨 LEAD CALIENTE: {{leadName}} - Valor estimado: ${{leadValue}}'
    },
    flowData: {
      nodes: [
        {
          id: 'trigger-lead-qualified',
          type: 'trigger',
          position: { x: 50, y: 100 },
          data: {
            label: 'Lead Calificado',
            config: {
              triggerType: 'manual',
              eventSource: 'lead-pipeline',
              description: 'Se activa cuando un lead cambia de estado a "Calificado"'
            }
          }
        },
        {
          id: 'validate-lead-value',
          type: 'logicGate',
          position: { x: 300, y: 100 },
          data: {
            label: 'Validar Valor del Lead',
            config: {
              condition: 'lead.estimatedValue > 5000',
              trueOutput: 'high_value',
              falseOutput: 'standard_value',
              variables: {
                minimumValue: 5000
              }
            }
          }
        },
        {
          id: 'calculate-lead-score',
          type: 'dataTransform',
          position: { x: 300, y: 250 },
          data: {
            label: 'Calcular Score del Lead',
            config: {
              transformations: [
                {
                  field: 'leadScore',
                  operation: 'calculate',
                  formula: '(lead.estimatedValue * 0.3) + (lead.urgency * 10) + (lead.companySize * 5)'
                },
                {
                  field: 'priority',
                  operation: 'classify',
                  conditions: [
                    { if: 'leadScore > 100', then: 'critical' },
                    { if: 'leadScore > 50', then: 'high' },
                    { else: 'medium' }
                  ]
                }
              ]
            }
          }
        },
        {
          id: 'notify-slack-high-value',
          type: 'apiCall',
          position: { x: 550, y: 50 },
          data: {
            label: 'Notificar Slack - Alto Valor',
            config: {
              method: 'POST',
              url: 'https://hooks.slack.com/services/{{connections.slack.webhookUrl}}',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: '#ventas-urgente',
                text: '🚨 *LEAD CALIENTE DETECTADO*',
                attachments: [
                  {
                    color: 'danger',
                    fields: [
                      { title: 'Empresa', value: '{{lead.name}}', short: true },
                      { title: 'Valor Estimado', value: '${{lead.estimatedValue}}', short: true },
                      { title: 'Contacto', value: '{{lead.email}}', short: true },
                      { title: 'Teléfono', value: '{{lead.phone}}', short: true },
                      { title: 'Score', value: '{{calculatedScore.leadScore}}', short: true },
                      { title: 'Prioridad', value: '{{calculatedScore.priority}}', short: true }
                    ],
                    actions: [
                      {
                        type: 'button',
                        text: 'Ver en Mar-IA',
                        url: 'https://app.mar-ia.com/leads/{{lead.id}}'
                      }
                    ]
                  }
                ]
              }),
              connectionId: 'slack'
            }
          }
        },
        {
          id: 'notify-email-standard',
          type: 'apiCall',
          position: { x: 550, y: 200 },
          data: {
            label: 'Notificar por Email - Estándar',
            config: {
              method: 'POST',
              url: '/api/email/send-notification',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: 'ventas@empresa.com',
                subject: 'Nuevo Lead Calificado: {{lead.name}}',
                template: 'lead-notification',
                data: {
                  leadName: '{{lead.name}}',
                  leadEmail: '{{lead.email}}',
                  leadPhone: '{{lead.phone}}',
                  estimatedValue: '{{lead.estimatedValue}}',
                  score: '{{calculatedScore.leadScore}}'
                }
              })
            }
          }
        },
        {
          id: 'update-lead-status',
          type: 'apiCall',
          position: { x: 800, y: 100 },
          data: {
            label: 'Actualizar Estado del Lead',
            config: {
              method: 'POST',
              url: '/api/leads/update-status',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                leadId: '{{lead.id}}',
                status: 'notified',
                notes: 'Notificación enviada al equipo de ventas',
                priority: '{{calculatedScore.priority}}',
                lastAction: 'automated_notification',
                timestamp: '{{now}}'
              })
            }
          }
        }
      ],
      edges: [
        {
          id: 'trigger-to-logic',
          source: 'trigger-lead-qualified',
          target: 'validate-lead-value',
          type: 'default'
        },
        {
          id: 'trigger-to-transform',
          source: 'trigger-lead-qualified',
          target: 'calculate-lead-score',
          type: 'default'
        },
        {
          id: 'logic-to-slack',
          source: 'validate-lead-value',
          target: 'notify-slack-high-value',
          type: 'conditional',
          sourceHandle: 'true'
        },
        {
          id: 'logic-to-email',
          source: 'validate-lead-value',
          target: 'notify-email-standard',
          type: 'conditional',
          sourceHandle: 'false'
        },
        {
          id: 'slack-to-update',
          source: 'notify-slack-high-value',
          target: 'update-lead-status',
          type: 'default'
        },
        {
          id: 'email-to-update',
          source: 'notify-email-standard',
          target: 'update-lead-status',
          type: 'default'
        }
      ]
    }
  },
  {
    id: 'ai-call-high-priority',
    name: 'Llamada IA a Leads de Alta Prioridad',
    description: 'Inicia automáticamente una llamada con IA conversacional usando ElevenLabs para leads marcados como alta prioridad.',
    category: 'comunicacion',
    difficulty: 'avanzado',
    estimatedTime: '15-25 minutos',
    useCase: 'Ideal para equipos que quieren escalar su alcance con llamadas automatizadas inteligentes para leads premium.',
    requiredConnections: ['elevenlabs', 'telephony'],
    variables: {
      aiVoiceId: 'rachel',
      callScript: 'Hola, hablas con el asistente de {{companyName}}. Te contactamos porque mostraste interés en nuestros servicios...',
      maxCallDuration: 300,
      followUpDelay: 2
    },
    flowData: {
      nodes: [
        {
          id: 'trigger-high-priority',
          type: 'trigger',
          position: { x: 50, y: 150 },
          data: {
            label: 'Lead Alta Prioridad',
            config: {
              triggerType: 'webhook',
              eventSource: 'lead-priority-update',
              condition: 'lead.priority === "high" || lead.tags.includes("vip")',
              description: 'Se activa cuando un lead es marcado como alta prioridad'
            }
          }
        },
        {
          id: 'validate-call-hours',
          type: 'logicGate',
          position: { x: 300, y: 150 },
          data: {
            label: 'Validar Horario de Llamada',
            config: {
              condition: 'current_hour >= 9 && current_hour <= 18 && current_day !== "sunday"',
              trueOutput: 'call_now',
              falseOutput: 'schedule_later',
              variables: {
                businessHours: { start: 9, end: 18 },
                excludeDays: ['sunday'],
                timeZone: 'America/Mexico_City'
              }
            }
          }
        },
        {
          id: 'prepare-call-data',
          type: 'dataTransform',
          position: { x: 550, y: 100 },
          data: {
            label: 'Preparar Datos de Llamada',
            config: {
              transformations: [
                {
                  field: 'personalizedScript',
                  operation: 'template',
                  template: 'Hola {{lead.name}}, hablas con el asistente virtual de {{company.name}}. Te contactamos porque {{lead.interestReason}}. ¿Tienes unos minutos para hablar sobre cómo podemos ayudarte?'
                },
                {
                  field: 'callMetadata',
                  operation: 'object',
                  value: {
                    leadId: '{{lead.id}}',
                    campaignId: '{{lead.campaignId}}',
                    expectedDuration: '{{variables.maxCallDuration}}',
                    voiceSettings: {
                      voiceId: '{{variables.aiVoiceId}}',
                      stability: 0.8,
                      similarityBoost: 0.7,
                      speed: 1.0
                    }
                  }
                },
                {
                  field: 'fallbackActions',
                  operation: 'array',
                  value: [
                    { action: 'send_whatsapp', delay: 1800 },
                    { action: 'send_email', delay: 3600 },
                    { action: 'schedule_human_call', delay: 86400 }
                  ]
                }
              ]
            }
          }
        },
        {
          id: 'initiate-ai-call',
          type: 'conversationalAICall',
          position: { x: 800, y: 100 },
          data: {
            label: 'Iniciar Llamada con IA',
            config: {
              phoneNumber: '{{lead.phone}}',
              voiceId: '{{preparedData.callMetadata.voiceSettings.voiceId}}',
              script: '{{preparedData.personalizedScript}}',
              maxDuration: '{{variables.maxCallDuration}}',
              connectionId: 'elevenlabs',
              conversationFlow: [
                {
                  stage: 'introduction',
                  prompt: 'Preséntate de manera amigable y explica el motivo de la llamada',
                  expectedResponses: ['interesado', 'no_interesado', 'mas_informacion']
                },
                {
                  stage: 'qualification',
                  prompt: 'Haz preguntas de calificación sobre necesidades y presupuesto',
                  expectedResponses: ['calificado', 'no_calificado', 'necesita_tiempo']
                },
                {
                  stage: 'closure',
                  prompt: 'Programa una cita o agenda seguimiento según la respuesta',
                  expectedResponses: ['cita_agendada', 'seguimiento_programado', 'no_contactar']
                }
              ],
              fallbackBehavior: {
                noAnswer: 'schedule_callback',
                busySignal: 'retry_later',
                invalidNumber: 'update_contact_info'
              }
            }
          }
        },
        {
          id: 'schedule-callback',
          type: 'apiCall',
          position: { x: 550, y: 250 },
          data: {
            label: 'Programar Llamada',
            config: {
              method: 'POST',
              url: '/api/scheduling/create-callback',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                leadId: '{{lead.id}}',
                scheduledFor: '{{add_hours(now, variables.followUpDelay)}}',
                type: 'ai_call_retry',
                priority: 'high',
                notes: 'Llamada programada - horario fuera de servicio',
                maxRetries: 3
              })
            }
          }
        },
        {
          id: 'process-call-result',
          type: 'dataTransform',
          position: { x: 1050, y: 100 },
          data: {
            label: 'Procesar Resultado',
            config: {
              transformations: [
                {
                  field: 'callSummary',
                  operation: 'ai_analysis',
                  prompt: 'Analiza la transcripción de la llamada y extrae: intención del cliente, nivel de interés, próximos pasos recomendados, y score de calificación del 1-10'
                },
                {
                  field: 'nextActions',
                  operation: 'conditional',
                  conditions: [
                    {
                      if: 'callResult.outcome === "appointment_scheduled"',
                      then: ['send_calendar_invite', 'prepare_meeting_materials']
                    },
                    {
                      if: 'callResult.outcome === "interested_but_busy"',
                      then: ['schedule_followup_call', 'send_information_email']
                    },
                    {
                      if: 'callResult.outcome === "not_interested"',
                      then: ['update_lead_status_cold', 'add_to_nurture_campaign']
                    },
                    {
                      if: 'callResult.outcome === "call_failed"',
                      then: ['try_whatsapp_contact', 'schedule_human_followup']
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          id: 'update-crm-record',
          type: 'apiCall',
          position: { x: 1300, y: 100 },
          data: {
            label: 'Actualizar CRM',
            config: {
              method: 'POST',
              url: '/api/leads/update-interaction',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                leadId: '{{lead.id}}',
                interactionType: 'ai_phone_call',
                outcome: '{{callResult.outcome}}',
                duration: '{{callResult.duration}}',
                transcription: '{{callResult.transcription}}',
                summary: '{{processedResult.callSummary}}',
                qualificationScore: '{{processedResult.qualificationScore}}',
                nextActions: '{{processedResult.nextActions}}',
                timestamp: '{{now}}',
                aiAgent: {
                  voiceId: '{{variables.aiVoiceId}}',
                  model: 'elevenlabs-conversational',
                  confidence: '{{callResult.confidence}}'
                }
              })
            }
          }
        }
      ],
      edges: [
        {
          id: 'trigger-to-hours',
          source: 'trigger-high-priority',
          target: 'validate-call-hours',
          type: 'default'
        },
        {
          id: 'hours-to-prepare',
          source: 'validate-call-hours',
          target: 'prepare-call-data',
          type: 'conditional',
          sourceHandle: 'true'
        },
        {
          id: 'hours-to-schedule',
          source: 'validate-call-hours',
          target: 'schedule-callback',
          type: 'conditional',
          sourceHandle: 'false'
        },
        {
          id: 'prepare-to-call',
          source: 'prepare-call-data',
          target: 'initiate-ai-call',
          type: 'default'
        },
        {
          id: 'call-to-process',
          source: 'initiate-ai-call',
          target: 'process-call-result',
          type: 'default'
        },
        {
          id: 'process-to-update',
          source: 'process-call-result',
          target: 'update-crm-record',
          type: 'default'
        }
      ]
    }
  },
  {
    id: 'email-team-notification-new-lead',
    name: 'Notificar al Equipo sobre Nuevo Lead',
    description: 'Envía automáticamente un email al equipo de ventas cuando se recibe un nuevo lead calificado.',
    category: 'notificaciones',
    difficulty: 'facil',
    estimatedTime: '3-5 minutos',
    useCase: 'Perfecto para equipos que quieren notificación inmediata por email cuando llega un lead importante.',
    requiredConnections: [],
    variables: {
      fromEmail: 'sistema@empresa.com',
      teamEmails: '{{team.emails}}',
      emailSubject: 'Nuevo Lead Calificado: {{lead.name}}'
    },
    flowData: {
      nodes: [
        {
          id: 'trigger-new-lead',
          type: 'trigger',
          position: { x: 50, y: 100 },
          data: {
            label: 'Nuevo Lead Calificado',
            config: {
              triggerType: 'manual_lead_action',
              eventSource: 'lead-qualification',
              description: 'Se activa cuando un lead es marcado como calificado'
            }
          }
        },
        {
          id: 'validate-lead-data',
          type: 'logicGate',
          position: { x: 300, y: 100 },
          data: {
            label: 'Validar Datos del Lead',
            config: {
              condition: 'lead.name && lead.email && lead.phone',
              trueOutput: 'valid_lead',
              falseOutput: 'invalid_lead',
              description: 'Verifica que el lead tenga los datos mínimos requeridos'
            }
          }
        },
        {
          id: 'send-team-notification',
          type: 'sendEmail',
          position: { x: 550, y: 50 },
          data: {
            label: 'Enviar Email al Equipo',
            config: {
              from: 'sistema@empresa.com',
              to: '{{team.emails}}',
              subject: '🎯 Nuevo Lead Calificado: {{lead.name}}',
              bodyTemplate: '¡Hola equipo!\n\nTenemos un nuevo lead calificado que requiere atención:\n\n📋 INFORMACIÓN DEL LEAD:\n• Nombre: {{lead.name}}\n• Email: {{lead.email}}\n• Teléfono: {{lead.phone}}\n• Empresa: {{lead.company}}\n• Fuente: {{lead.source}}\n• Valor estimado: ${{lead.estimatedValue}}\n\n💡 CONTEXTO:\n• Interés mostrado: {{lead.interestArea}}\n• Urgencia: {{lead.urgency}}\n• Mejor horario de contacto: {{lead.preferredContactTime}}\n\n🎬 PRÓXIMOS PASOS:\n1. Revisar perfil completo en el CRM\n2. Asignar responsable en las próximas 2 horas\n3. Contactar en menos de 24 horas\n\n¡A por este lead! 💪\n\n---\nMensaje generado automáticamente por Mar-IA CRM\nTimestamp: {{now}}'
            }
          }
        },
        {
          id: 'log-notification-sent',
          type: 'monitor',
          position: { x: 800, y: 50 },
          data: {
            label: 'Registrar Notificación Enviada',
            config: {
              logLevel: 'info',
              message: 'Notificación por email enviada al equipo para lead: {{lead.name}}',
              trackEvents: ['email_sent', 'team_notified'],
              saveToDatabase: true,
              alertOnError: false
            }
          }
        },
        {
          id: 'send-fallback-slack',
          type: 'apiCall',
          position: { x: 550, y: 200 },
          data: {
            label: 'Notificación de Respaldo (Datos Incompletos)',
            config: {
              method: 'POST',
              url: '/api/slack/send-message',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: '#leads-incompletos',
                text: '⚠️ Lead con datos incompletos recibido',
                attachments: [
                  {
                    color: 'warning',
                    fields: [
                      { title: 'ID', value: '{{lead.id}}', short: true },
                      { title: 'Nombre', value: '{{lead.name || "No proporcionado"}}', short: true },
                      { title: 'Email', value: '{{lead.email || "No proporcionado"}}', short: true },
                      { title: 'Teléfono', value: '{{lead.phone || "No proporcionado"}}', short: true }
                    ]
                  }
                ]
              })
            }
          }
        }
      ],
      edges: [
        {
          id: 'trigger-to-validate',
          source: 'trigger-new-lead',
          target: 'validate-lead-data',
          type: 'default'
        },
        {
          id: 'validate-to-email',
          source: 'validate-lead-data',
          target: 'send-team-notification',
          type: 'conditional',
          sourceHandle: 'true'
        },
        {
          id: 'validate-to-fallback',
          source: 'validate-lead-data',
          target: 'send-fallback-slack',
          type: 'conditional',
          sourceHandle: 'false'
        },
        {
          id: 'email-to-log',
          source: 'send-team-notification',
          target: 'log-notification-sent',
          type: 'default'
        }
      ]
    }
  },
  {
    id: 'template-initiate-ai-call',
    name: 'Iniciar Llamada IA a Lead',
    description: 'Inicia una llamada conversacional con un agente de IA de ElevenLabs a un lead específico.',
    category: 'comunicacion',
    difficulty: 'intermedio',
    estimatedTime: '10 minutos',
    useCase: 'Perfecto para calificar leads, dar la bienvenida o realizar seguimientos automáticos con una voz hiperrealista.',
    requiredConnections: ['elevenlabs'],
    variables: {
      agentId: 'TU_AGENT_ID_POR_DEFECTO',
      voiceId: 'TU_VOICE_ID_POR_DEFECTO',
      companyName: 'Tu Empresa',
      webhookBaseUrl: 'https://tu-crm.com'
    },
    flowData: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          position: { x: 50, y: 150 },
          data: { 
            label: 'Recibir Datos del Lead',
            config: { 
              name: 'Recibir Datos del Lead',
              triggerType: 'manual_lead_action',
              description: 'Trigger para iniciar llamada IA con datos del lead'
            } 
          }
        },
        {
          id: 'generate-script',
          type: 'dataTransform',
          position: { x: 300, y: 150 },
          data: {
            label: 'Generar Guion de Llamada',
            config: {
              name: 'Generar Guion de Llamada',
              transformations: [
                {
                  field: 'callScript',
                  operation: 'template',
                  template: 'Hola {{fullName}}, soy María, asistente virtual de {{companyName}}. Te contacto porque has mostrado interés en nuestros servicios de {{businessType || "consultoría"}}. Me gustaría conocer más sobre tu proyecto y cómo podemos ayudarte. ¿Tienes unos minutos para hablar?'
                },
                {
                  field: 'callMetadata',
                  operation: 'object',
                  value: {
                    crm_lead_id: '{{id}}',
                    crm_organization_id: '{{organizationId}}',
                    lead_name: '{{fullName}}',
                    business_type: '{{businessType}}'
                  }
                }
              ]
            }
          }
        },
        {
          id: 'initiate-call',
          type: 'conversationalAICall',
          position: { x: 550, y: 150 },
          data: {
            label: 'Llamar con ElevenLabs',
            config: {
              name: 'Llamar con ElevenLabs',
              agentId: '{{variables.agentId}}',
              voiceId: '{{variables.voiceId}}',
              phoneField: 'phone',
              instructionsTemplate: '{{generate-script.callScript}}',
              maxDuration: 300,
              webhookUrl: '{{variables.webhookBaseUrl}}/api/flows/run/procesar-resultado-llamada',
              updateLeadStage: true,
              newStageOnSuccess: 'contacted'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'generate-script', type: 'default' },
        { id: 'e2', source: 'generate-script', target: 'initiate-call', type: 'default' }
      ]
    }
  },
  {
    id: 'template-process-ai-call-result',
    name: 'Procesar Resultado de Llamada IA',
    description: 'Recibe los datos de una llamada finalizada desde ElevenLabs, analiza el resultado y actualiza el CRM.',
    category: 'integracion',
    difficulty: 'avanzado',
    estimatedTime: '15 minutos',
    useCase: 'Actúa como un webhook inteligente para registrar transcripciones, actualizar el estado del lead y notificar al equipo.',
    requiredConnections: ['resend'],
    variables: {
      teamEmails: 'ventas@empresa.com',
      notificationFrom: 'sistema@empresa.com'
    },
    flowData: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          position: { x: 50, y: 250 },
          data: { 
            label: 'Webhook: Resultado de Llamada Recibido',
            config: { 
              name: 'Webhook: Resultado de Llamada Recibido',
              triggerType: 'webhook',
              description: 'Recibe resultados de llamadas desde ElevenLabs'
            } 
          }
        },
        {
          id: 'update-lead-history',
          type: 'apiCall',
          position: { x: 300, y: 150 },
          data: {
            label: 'Guardar Transcripción en Lead',
            config: {
              name: 'Guardar Transcripción en Lead',
              method: 'POST',
              url: '/api/leads/add-communication',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                leadId: '{{metadata.crm_lead_id}}',
                type: 'AI_CALL_RESULT',
                status: '{{status}}',
                duration_seconds: '{{duration_seconds}}',
                transcript: '{{transcript}}',
                timestamp: '{{now}}',
                metadata: {
                  call_outcome: '{{outcome}}',
                  confidence_score: '{{confidence}}',
                  ai_agent_used: 'elevenlabs'
                }
              })
            }
          }
        },
        {
          id: 'check-if-demo-booked',
          type: 'logicGate',
          position: { x: 300, y: 350 },
          data: {
            label: '¿Se Agendó una Demo?',
            config: {
              name: '¿Se Agendó una Demo?',
              condition: 'transcript.toLowerCase().includes("demo") || transcript.toLowerCase().includes("reunión") || transcript.toLowerCase().includes("cita") || outcome === "appointment_scheduled"',
              trueOutput: 'demo_booked',
              falseOutput: 'followup_needed'
            }
          }
        },
        {
          id: 'notify-team-success',
          type: 'sendEmail',
          position: { x: 550, y: 250 },
          data: {
            label: 'Notificar Demo Agendada',
            config: {
              name: 'Notificar Demo Agendada',
              from: '{{variables.notificationFrom}}',
              to: '{{variables.teamEmails}}',
              subject: '🎉 ¡Éxito! Demo Agendada por IA - {{metadata.lead_name}}',
              bodyTemplate: '¡Excelentes noticias!\n\nEl agente de IA ha logrado agendar una demo con el lead {{metadata.lead_name}}.\n\n📋 DETALLES DE LA LLAMADA:\n• Lead ID: {{metadata.crm_lead_id}}\n• Duración: {{duration_seconds}} segundos\n• Estado: {{status}}\n• Resultado: {{outcome}}\n\n📝 TRANSCRIPCIÓN:\n{{transcript}}\n\n🎯 PRÓXIMOS PASOS:\n1. Confirmar la demo en el calendario\n2. Preparar materiales de presentación\n3. Enviar recordatorio al lead\n\n¡Genial trabajo del sistema automatizado! 🚀\n\n---\nMensaje generado automáticamente\nTimestamp: {{now}}'
            }
          }
        },
        {
          id: 'notify-team-followup',
          type: 'sendEmail',
          position: { x: 550, y: 450 },
          data: {
            label: 'Notificar para Seguimiento Manual',
            config: {
              name: 'Notificar para Seguimiento Manual',
              from: '{{variables.notificationFrom}}',
              to: '{{variables.teamEmails}}',
              subject: '📞 Seguimiento Necesario - {{metadata.lead_name}}',
              bodyTemplate: 'Hola equipo,\n\nLa llamada con IA ha finalizado pero se requiere seguimiento manual.\n\n📋 DETALLES DE LA LLAMADA:\n• Lead ID: {{metadata.crm_lead_id}}\n• Duración: {{duration_seconds}} segundos\n• Estado: {{status}}\n• Resultado: {{outcome}}\n\n📝 TRANSCRIPCIÓN:\n{{transcript}}\n\n🎯 ACCIONES RECOMENDADAS:\n1. Revisar la transcripción completa en el CRM\n2. Evaluar el nivel de interés del lead\n3. Definir estrategia de seguimiento personalizada\n4. Contactar en las próximas 24-48 horas\n\nRecuerda revisar el historial completo del lead antes del contacto.\n\n---\nMensaje generado automáticamente\nTimestamp: {{now}}'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'update-lead-history', type: 'default' },
        { id: 'e2', source: 'trigger', target: 'check-if-demo-booked', type: 'default' },
        { id: 'e3', source: 'check-if-demo-booked', target: 'notify-team-success', type: 'conditional', sourceHandle: 'true' },
        { id: 'e4', source: 'check-if-demo-booked', target: 'notify-team-followup', type: 'conditional', sourceHandle: 'false' }
      ]
    }
  }
];

export const getTemplatesByCategory = (category: FlowTemplate['category']): FlowTemplate[] => {
  return FLOW_TEMPLATES.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: FlowTemplate['difficulty']): FlowTemplate[] => {
  return FLOW_TEMPLATES.filter(template => template.difficulty === difficulty);
};

export const getTemplateById = (id: string): FlowTemplate | undefined => {
  return FLOW_TEMPLATES.find(template => template.id === id);
};