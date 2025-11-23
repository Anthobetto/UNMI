// WhatsApp Cloud API Service - Integración con Meta
// Implementa envío de templates y mensajes de texto
// Path: server/src/services/WhatsAppCloudService.ts

import type { Message, Template } from '../../../shared/schema';

export interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  apiVersion?: string;
}

export interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  variables?: Record<string, string>;
  phoneNumberId: string;
}

export interface SendTextParams {
  to: string;
  message: string;
  phoneNumberId: string;
}

export interface WhatsAppResponse {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
}

export class WhatsAppCloudService {
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    if (!this.accessToken) {
      console.warn('⚠️ WHATSAPP_ACCESS_TOKEN not configured');
    }
  }

  /**
   * Enviar template de WhatsApp (requiere aprobación previa en Meta)
   */
  async sendTemplate(params: SendTemplateParams): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${params.phoneNumberId}/messages`;

      // Construir componentes del template
      const components = [];
      
      if (params.variables && Object.keys(params.variables).length > 0) {
        components.push({
          type: 'body',
          parameters: Object.values(params.variables).map(value => ({
            type: 'text',
            text: value,
          })),
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.templateName,
          language: {
            code: params.languageCode || 'es',
          },
          components: components.length > 0 ? components : undefined,
        },
      };

      console.log('📤 Sending WhatsApp template:', {
        to: params.to,
        template: params.templateName,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('❌ WhatsApp API error:', data);
        return {
          messageId: '',
          status: 'failed',
          error: data.error?.message || 'Unknown error',
        };
      }

      console.log('✅ Template sent successfully:', data.messages[0].id);

      return {
        messageId: data.messages[0].id,
        status: 'sent',
      };

    } catch (error: any) {
      console.error('❌ Error sending WhatsApp template:', error);
      return {
        messageId: '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Enviar mensaje de texto simple (solo válido dentro de ventana de 24h)
   */
  async sendTextMessage(params: SendTextParams): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${params.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'text',
        text: {
          body: params.message,
        },
      };

      console.log('📤 Sending WhatsApp text message:', {
        to: params.to,
        preview: params.message.substring(0, 50),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('❌ WhatsApp API error:', data);
        return {
          messageId: '',
          status: 'failed',
          error: data.error?.message || 'Unknown error',
        };
      }

      console.log('✅ Text message sent successfully:', data.messages[0].id);

      return {
        messageId: data.messages[0].id,
        status: 'sent',
      };

    } catch (error: any) {
      console.error('❌ Error sending WhatsApp text:', error);
      return {
        messageId: '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Procesar template: reemplazar variables
   */
  processTemplate(template: Template, variables?: Record<string, string>): string {
    let content = template.content;
    
    const allVariables = {
      ...template.variables,
      ...variables,
    };

    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, value as string);
    });

    return content;
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }

  /**
   * Marcar mensaje como leído (para notificar al usuario que viste su mensaje)
   */
  async markAsRead(messageId: string, phoneNumberId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return response.ok;

    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
}

export const whatsAppCloudService = new WhatsAppCloudService();