import telnyx from 'telnyx';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde la raíz
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

if (!TELNYX_API_KEY) {
  console.warn('⚠️ Missing Telnyx API Key. Telephony features will be disabled.');
}

export interface TelnyxCallParams {
  to: string;
  from: string;
  connectionId: string;
  webhookUrl: string;
}

export interface TelnyxSmsParams {
  to: string;
  from: string;
  text: string;
}

export class TelnyxService {
  private client: any;

  constructor() {
    // @ts-ignore
    this.client = new telnyx(TELNYX_API_KEY || 'dummy_key');
  }

  /**
   * Iniciar una llamada saliente (Call Control)
   */
  async createCall(params: TelnyxCallParams): Promise<any> {
    try {
      console.log('📞 Initiating Telnyx call to:', params.to);
      const call = await this.client.calls.create({
        to: params.to,
        from: params.from,
        connection_id: params.connectionId,
        webhook_url: params.webhookUrl,
      });
      return call;
    } catch (error) {
      console.error('❌ Error creating Telnyx call:', error);
      throw error;
    }
  }

  /**
   * Enviar un mensaje de texto (SMS)
   */
  async sendSms(params: TelnyxSmsParams): Promise<any> {
    try {
      console.log('💬 Sending SMS to:', params.to);
      const message = await this.client.messages.create({
        to: params.to,
        from: params.from,
        text: params.text,
      });
      return message;
    } catch (error) {
      console.error('❌ Error sending Telnyx SMS:', error);
      throw error;
    }
  }

  /**
   * Listar aplicaciones de Call Control
   */
  async listApplications(): Promise<any> {
    return this.client.callControlApplications.list();
  }

  /**
   * Listar números de teléfono activos
   */
  async listPhoneNumbers(): Promise<any> {
    return this.client.phoneNumbers.list();
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!TELNYX_API_KEY && TELNYX_API_KEY !== 'dummy_key';
  }
}

export const telnyxService = new TelnyxService();
