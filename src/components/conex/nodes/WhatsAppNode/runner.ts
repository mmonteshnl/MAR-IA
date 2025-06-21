import { NodeRunner, NodeExecutionContext, NodeExecutionResult } from '../../types/nodeRunner';

interface WhatsAppConfig {
  instanceId: string;
  phoneNumber: string;
  message: string;
  messageTemplate: string;
  useTemplate: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  webhookPort: string;
  variables: {
    [key: string]: string;
  };
}

export class WhatsAppNodeRunner implements NodeRunner<WhatsAppConfig> {
  async execute(
    config: WhatsAppConfig, 
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate required configuration
      if (!config.instanceId) {
        throw new Error('Instance ID is required');
      }

      // Get phone number from context or config
      let phoneNumber = config.phoneNumber;
      
      // Try to get phone number from previous node data or input
      if (!phoneNumber && context.inputData) {
        phoneNumber = context.inputData.phoneNumber || 
                     context.inputData.leadPhone || 
                     context.inputData.phone ||
                     context.inputData.contactNumber;
      }

      if (!phoneNumber) {
        throw new Error('Phone number is required. Provide it in config or input data.');
      }

      // Process message with variables
      let finalMessage: string;
      
      if (config.useTemplate && config.messageTemplate) {
        // Merge config variables with input data
        const allVariables = {
          ...config.variables,
          ...context.inputData // Input data can override config variables
        };
        
        finalMessage = this.processTemplate(config.messageTemplate, allVariables);
      } else {
        finalMessage = config.message || 'Default WhatsApp message';
      }

      // Validate message length (WhatsApp limit is ~4096 characters)
      if (finalMessage.length > 4096) {
        throw new Error('Message is too long. WhatsApp limit is 4096 characters.');
      }

      // Get organization ID from context
      const organizationId = context.organizationId || 'default';

      // Send WhatsApp message
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          instanceId: config.instanceId,
          message: {
            number: phoneNumber,
            text: finalMessage
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to send WhatsApp message`);
      }

      const executionTime = Date.now() - startTime;

      // Return successful result
      return {
        success: true,
        data: {
          messageId: result.data?.key?.id || `msg_${Date.now()}`,
          phoneNumber,
          message: finalMessage,
          instanceId: config.instanceId,
          timestamp: new Date().toISOString(),
          executionTime,
          status: 'sent',
          // Include message details for monitoring
          messageDetails: {
            length: finalMessage.length,
            type: 'text',
            templated: config.useTemplate
          }
        },
        logs: [
          `WhatsApp message sent to ${phoneNumber}`,
          `Message length: ${finalMessage.length} characters`,
          `Execution time: ${executionTime}ms`,
          config.useTemplate ? 'Used template with variables' : 'Used direct message'
        ]
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        data: {
          phoneNumber: config.phoneNumber || 'unknown',
          instanceId: config.instanceId,
          timestamp: new Date().toISOString(),
          executionTime,
          status: 'failed'
        },
        logs: [
          `WhatsApp message failed: ${errorMessage}`,
          `Execution time: ${executionTime}ms`
        ]
      };
    }
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    // Replace variables in the format {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const replacement = value !== null && value !== undefined ? String(value) : '';
      processed = processed.replace(regex, replacement);
    });
    
    // Also support common lead fields with dot notation
    const commonMappings = {
      'lead.name': variables.leadName || variables.name || '',
      'lead.email': variables.leadEmail || variables.email || '',
      'lead.phone': variables.leadPhone || variables.phone || variables.phoneNumber || '',
      'lead.company': variables.leadCompany || variables.company || '',
      'lead.industry': variables.leadIndustry || variables.industry || '',
      'lead.stage': variables.leadStage || variables.stage || '',
      'lead.source': variables.leadSource || variables.source || '',
      'lead.value': variables.leadValue || variables.value || '',
      'company.name': variables.companyName || 'Tu Empresa',
      'now': new Date().toLocaleDateString(),
      'today': new Date().toLocaleDateString(),
      'time': new Date().toLocaleTimeString()
    };
    
    Object.entries(commonMappings).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    });
    
    return processed;
  }

  // Validate that the WhatsApp instance is available and connected
  async validateConnection(config: WhatsAppConfig): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await fetch('/api/whatsapp/webhook-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceId: config.instanceId,
          webhookPort: config.webhookPort 
        })
      });

      const result = await response.json();
      
      return {
        connected: result.connected || false,
        message: result.message || (result.connected ? 
          'WhatsApp instance is connected and ready' : 
          'WhatsApp instance is not connected'
        )
      };
    } catch (error) {
      return {
        connected: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}