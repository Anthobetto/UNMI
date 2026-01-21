// Recovery Service - Template Method Pattern + Strategy Pattern
// Servicio para procesamiento de mensajes de recuperación con múltiples canales

import { MessageRequest, MessageResponse } from '@/types';
import { Template, Call, MessageChannel } from '@/shared/schema';
// Strategy Interface para canales de mensajería
interface IMessageChannel {
  send(recipient: string, content: string): Promise<MessageResponse>;
  getCost(): number;
  getName(): string;
}

// Concrete Strategies
class SMSChannel implements IMessageChannel {
  async send(recipient: string, content: string): Promise<MessageResponse> {
    console.log(`Sending SMS to ${recipient}: ${content}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      messageId: success ? `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
      error: success ? undefined : 'SMS delivery failed',
      cost: this.getCost(),
    };
  }

  getCost(): number {
    return 0.05; // €0.05 per SMS
  }

  getName(): string {
    return 'SMS';
  }
}

class WhatsAppChannel implements IMessageChannel {
  async send(recipient: string, content: string): Promise<MessageResponse> {
    console.log(`Sending WhatsApp to ${recipient}: ${content}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.05; // 95% success rate
    
    return {
      success,
      messageId: success ? `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
      error: success ? undefined : 'WhatsApp delivery failed',
      cost: this.getCost(),
    };
  }

  getCost(): number {
    return 0.03; // €0.03 per WhatsApp message
  }

  getName(): string {
    return 'WhatsApp';
  }
}

// Factory para canales
class MessageChannelFactory {
  private channels: Map<string, IMessageChannel> = new Map([
    ['sms', new SMSChannel()],
    ['whatsapp', new WhatsAppChannel()],
  ]);

  getChannel(channelType: string): IMessageChannel | null {
    return this.channels.get(channelType) || null;
  }

  // OCP: Permite agregar nuevos canales
  registerChannel(channelType: string, channel: IMessageChannel): void {
    this.channels.set(channelType, channel);
  }
}

export interface RecoveryConfig {
  enabled: boolean;
  delayMinutes: number;
  maxRetries: number;
  channels: MessageChannel[];
  fallbackTemplate?: number;
}

export class RecoveryService {
  private config: RecoveryConfig;
  private channelFactory: MessageChannelFactory = new MessageChannelFactory();

  constructor(config: RecoveryConfig) {
    this.config = config;
  }

  // Template Method Pattern: Define el esqueleto del algoritmo
  async processMissedCall(call: Call, template: Template): Promise<MessageResponse> {
    if (!this.config.enabled) {
      return {
        success: false,
        error: 'Recovery service is disabled',
      };
    }

    try {
      // Paso 1: Validar compatibilidad
      if (!this.isTemplateCompatible(template, call)) {
        return {
          success: false,
          error: 'Template not compatible with call context',
        };
      }

      // Paso 2: Procesar contenido del template
      const processedContent = this.processTemplateContent(template, call);

      // Paso 3: Crear request de mensaje
      const messageRequest: MessageRequest = {
        recipient: call.callerNumber,
        content: processedContent,
        channel: template.channel,
        templateId: template.id,
        variables: Object.values(this.extractVariables(call))
      };

      // Paso 4: Enviar mensaje
      return await this.sendMessage(messageRequest);
    } catch (error) {
      console.error('Error processing missed call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    const { channel, content, recipient } = request;

    try {
      switch (channel) {
        case 'sms':
          return await this.sendViaSMS(recipient, content);
        case 'whatsapp':
          return await this.sendViaWhatsApp(recipient, content);
        case 'both':
          const smsResult = await this.sendViaSMS(recipient, content);
          const whatsappResult = await this.sendViaWhatsApp(recipient, content);
          
          return {
            success: smsResult.success && whatsappResult.success,
            messageId: `${smsResult.messageId},${whatsappResult.messageId}`,
            cost: (smsResult.cost || 0) + (whatsappResult.cost || 0),
          };
        default:
          return {
            success: false,
            error: 'Unsupported message channel',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  private async sendViaSMS(recipient: string, content: string): Promise<MessageResponse> {
    const channel = this.channelFactory.getChannel('sms');
    if (!channel) {
      return {
        success: false,
        error: 'SMS channel not available',
      };
    }
    return await channel.send(recipient, content);
  }

  private async sendViaWhatsApp(recipient: string, content: string): Promise<MessageResponse> {
    const channel = this.channelFactory.getChannel('whatsapp');
    if (!channel) {
      return {
        success: false,
        error: 'WhatsApp channel not available',
      };
    }
    return await channel.send(recipient, content);
  }

  private processTemplateContent(template: Template, call: Call): string {
    let content = template.content;
    
    const variables = this.extractVariables(call);
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return content;
  }

  private extractVariables(call: Call): Record<string, string> {
    return {
      caller_number: call.callerNumber,
      call_time: new Date(call.createdAt).toLocaleString('es-ES'),
      call_duration: call.duration?.toString() || '0',
      business_name: 'UNMI Business',
    };
  }

  private isTemplateCompatible(template: Template, call: Call): boolean {
    // Verificar que el template sea para llamadas perdidas
    if (template.type !== 'missed_call') return false;
    
    // Verificar que la llamada sea efectivamente perdida
    if (call.status !== 'missed') return false;
    
    // Verificar ubicación si el template es específico
    if (template.locationId && template.locationId !== call.routedToLocation) {
      return false;
    }
    
    return true;
  }

  updateConfig(newConfig: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  async testMessage(recipient: string, content: string, channel: MessageChannel): Promise<MessageResponse> {
    const request: MessageRequest = {
      recipient,
      content,
      channel,
    };
    
    return await this.sendMessage(request);
  }

  // Método para calcular costo estimado
  estimateCost(channel: MessageChannel, messageCount: number): number {
    switch (channel) {
      case 'sms':
        return messageCount * 0.05;
      case 'whatsapp':
        return messageCount * 0.03;
      case 'both':
        return messageCount * (0.05 + 0.03);
      default:
        return 0;
    }
  }
}

export const recoveryService = new RecoveryService({
  enabled: true,
  delayMinutes: 5,
  maxRetries: 3,
  channels: ['sms', 'whatsapp'],
});




