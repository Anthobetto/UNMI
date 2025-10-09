// WhatsApp Service - Messaging con fallback SMS
// Implementa Strategy pattern para múltiples canales

import type { Message, Template } from '../../../shared/schema';

export interface IWhatsAppService {
  sendWhatsAppMessage(message: Message, template?: Template): Promise<Message>;
  sendSMSFallback(message: Message): Promise<Message>;
  processTemplate(template: Template, message: Message): string;
}

export interface WhatsAppConfig {
  apiKey?: string;
  apiUrl?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioPhone?: string;
}

export class WhatsAppService implements IWhatsAppService {
  private config: WhatsAppConfig;

  constructor(config?: WhatsAppConfig) {
    this.config = {
      apiKey: process.env.WHATSAPP_API_KEY,
      apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1/messages',
      twilioSid: process.env.TWILIO_ACCOUNT_SID,
      twilioToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhone: process.env.TWILIO_PHONE_NUMBER,
      ...config,
    };
  }

  /**
   * Envía mensaje por WhatsApp con fallback a SMS
   */
  async sendWhatsAppMessage(message: Message, template?: Template): Promise<Message> {
    try {
      let messageContent = message.content;

      // Procesar template si se proporciona
      if (template && template.variables) {
        messageContent = this.processTemplate(template, message);
      }

      // Verificar configuración de WhatsApp
      if (!this.config.apiKey) {
        console.warn('WhatsApp API key not configured, trying SMS fallback');
        return await this.sendSMSFallback({ ...message, content: messageContent });
      }

      // Intentar envío por WhatsApp
      const response = await fetch(this.config.apiUrl!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: message.recipient,
          type: 'text',
          text: {
            body: messageContent,
          },
        }),
      });

      if (!response.ok) {
        console.error('WhatsApp API error:', response.statusText);
        // Fallback a SMS si WhatsApp falla
        return await this.sendSMSFallback({ ...message, content: messageContent });
      }

      const result = await response.json();

      return {
        ...message,
        content: messageContent,
        status: 'sent',
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      // Intentar SMS fallback en caso de error
      try {
        return await this.sendSMSFallback(message);
      } catch (smsError) {
        throw new Error('Failed to send message via WhatsApp or SMS');
      }
    }
  }

  /**
   * Fallback a SMS usando Twilio
   */
  async sendSMSFallback(message: Message): Promise<Message> {
    if (!this.config.twilioSid || !this.config.twilioToken) {
      // Si no hay Twilio configurado, simular en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 [DEV] Simulating SMS message:', {
          to: message.recipient,
          content: message.content,
        });

        return {
          ...message,
          type: 'SMS',
          status: 'sent',
        };
      }

      throw new Error('Twilio not configured for SMS fallback');
    }

    try {
      // Construir Twilio request
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioSid}/Messages.json`;
      
      const params = new URLSearchParams({
        To: message.recipient,
        From: this.config.twilioPhone!,
        Body: message.content,
      });

      const authHeader = Buffer.from(
        `${this.config.twilioSid}:${this.config.twilioToken}`
      ).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio API error: ${error}`);
      }

      return {
        ...message,
        type: 'SMS',
        status: 'sent',
      };
    } catch (error) {
      console.error('SMS fallback failed:', error);
      throw new Error('Failed to send SMS fallback');
    }
  }

  /**
   * Procesa variables del template
   */
  processTemplate(template: Template, message: Message): string {
    let content = template.content;
    const variables = template.variables as Record<string, string>;

    // Reemplazar variables con valores dinámicos
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const dynamicValue = this.getDynamicValue(key, message) || value;
      content = content.replace(new RegExp(placeholder, 'g'), dynamicValue);
    });

    return content;
  }

  /**
   * Obtiene valores dinámicos para campos comunes
   * @private
   */
  private getDynamicValue(key: string, message: Message): string | null {
    const dynamicFields: Record<string, () => string> = {
      'business_name': () => 'Tu Negocio', // Debería venir de user settings
      'cta_link': () => `https://booking.example.com/${message.recipient}`,
      'timestamp': () => new Date().toLocaleString('es-ES'),
      'phone': () => message.recipient,
    };

    return dynamicFields[key]?.() || null;
  }

  /**
   * Maneja mensajes entrantes de WhatsApp (webhook)
   */
  async handleIncomingWhatsApp(payload: any): Promise<void> {
    try {
      if (!payload.userId || !payload.phoneNumberId || !payload.content || !payload.from) {
        throw new Error('Invalid webhook payload');
      }

      console.log('📨 Incoming WhatsApp message:', {
        from: payload.from,
        content: payload.content.substring(0, 50),
      });

      // Aquí se podría procesar con chatbot AI
      // O guardar en DB para tracking
    } catch (error) {
      console.error('Error handling incoming WhatsApp:', error);
      throw new Error('Failed to process incoming WhatsApp message');
    }
  }
}

export const whatsAppService = new WhatsAppService();



