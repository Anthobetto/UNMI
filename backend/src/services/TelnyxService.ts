import telnyx from 'telnyx';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

if (!TELNYX_API_KEY) {
  console.warn('⚠️ Missing Telnyx API Key. Telephony features will be disabled.');
}

export interface TelnyxCallParams {
  to: string;
  from: string;
  connectionId: string;
  webhookUrl?: string;
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
   * Obtiene la instancia de una llamada activa
   */
  getCall(callControlId: string) {
    return new this.client.Call({ call_control_id: callControlId });
  }

  /**
   * Contestar una llamada entrante
   */
  async answerCall(callControlId: string): Promise<any> {
    try {
      const call = this.getCall(callControlId);
      await call.answer();
      console.log(`✅ Llamada contestada: ${callControlId}`);
    } catch (error) {
      console.error(`❌ Error contestando llamada ${callControlId}:`, error);
      throw error;
    }
  }

  /**
   * Reproducir audio usando Text-to-Speech (TTS)
   */
  async speak(callControlId: string, payload: string, language: string = 'es-ES', voice: string = 'female'): Promise<any> {
    try {
      const call = this.getCall(callControlId);
      await call.speak({
        payload,
        language,
        voice
      });
      console.log(`🗣️ Hablando en llamada ${callControlId}...`);
    } catch (error) {
      console.error(`❌ Error en TTS llamada ${callControlId}:`, error);
      throw error;
    }
  }

  /**
   * Colgar una llamada
   */
  async hangupCall(callControlId: string): Promise<any> {
    try {
      const call = this.getCall(callControlId);
      await call.hangup();
      console.log(`📴 Llamada colgada: ${callControlId}`);
    } catch (error) {
      console.error(`❌ Error colgando llamada ${callControlId}:`, error);
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