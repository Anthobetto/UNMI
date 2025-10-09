// Chatbot Service - Strategy Pattern + Factory Pattern
// Permite múltiples proveedores de chatbots extensibles

import { ChatbotIntegration, ChatbotResponse, ChatbotConfig } from '@/types';

// Strategy Interface
interface IChatbotProvider {
  processMessage(message: string, config: ChatbotConfig, context?: Record<string, any>): Promise<ChatbotResponse>;
}

// Concrete Strategies
class DialogflowProvider implements IChatbotProvider {
  async processMessage(message: string, config: ChatbotConfig, context?: Record<string, any>): Promise<ChatbotResponse> {
    console.log(`Processing with Dialogflow: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      "¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte?",
      "Entiendo tu consulta. Un agente se pondrá en contacto contigo pronto.",
      "¿Te gustaría agendar una cita? Puedo ayudarte con eso.",
      "Gracias por tu paciencia. Estamos aquí para ayudarte.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const confidence = Math.random() * 0.3 + 0.7;
    
    return {
      success: true,
      response: randomResponse,
      confidence,
    };
  }
}

class AzureProvider implements IChatbotProvider {
  async processMessage(message: string, config: ChatbotConfig, context?: Record<string, any>): Promise<ChatbotResponse> {
    console.log(`Processing with Azure Bot: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const responses = [
      "Hola, soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?",
      "Perfecto, he recibido tu mensaje. Te responderemos pronto.",
      "¿Necesitas información sobre nuestros servicios?",
      "Gracias por contactarnos. Estamos procesando tu solicitud.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const confidence = Math.random() * 0.2 + 0.8;
    
    return {
      success: true,
      response: randomResponse,
      confidence,
    };
  }
}

class AWSProvider implements IChatbotProvider {
  async processMessage(message: string, config: ChatbotConfig, context?: Record<string, any>): Promise<ChatbotResponse> {
    console.log(`Processing with AWS Lex: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const responses = [
      "Hola, soy tu chatbot de UNMI. ¿En qué puedo asistirte?",
      "Entendido. Procesando tu solicitud...",
      "¿Te gustaría conocer más sobre nuestros servicios?",
      "Perfecto, he registrado tu consulta.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const confidence = Math.random() * 0.25 + 0.75;
    
    return {
      success: true,
      response: randomResponse,
      confidence,
    };
  }
}

class CustomProvider implements IChatbotProvider {
  async processMessage(message: string, config: ChatbotConfig, context?: Record<string, any>): Promise<ChatbotResponse> {
    console.log(`Processing with custom webhook: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = [
      "Respuesta personalizada: He recibido tu mensaje.",
      "Tu consulta ha sido procesada correctamente.",
      "Gracias por contactarnos. Te responderemos pronto.",
      "Mensaje recibido y en proceso.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const confidence = Math.random() * 0.1 + 0.9;
    
    return {
      success: true,
      response: randomResponse,
      confidence,
    };
  }
}

// Factory Pattern
class ChatbotProviderFactory {
  private providers: Map<string, IChatbotProvider> = new Map([
    ['dialogflow', new DialogflowProvider()],
    ['azure', new AzureProvider()],
    ['aws', new AWSProvider()],
    ['custom', new CustomProvider()],
  ]);

  getProvider(providerType: string): IChatbotProvider | null {
    return this.providers.get(providerType) || null;
  }

  // OCP: Permite agregar nuevos providers sin modificar código existente
  registerProvider(providerType: string, provider: IChatbotProvider): void {
    this.providers.set(providerType, provider);
  }
}

export class ChatbotService {
  private integrations: Map<string, ChatbotIntegration> = new Map();
  private fallbackTemplates: Map<string, string> = new Map();
  private providerFactory: ChatbotProviderFactory = new ChatbotProviderFactory();

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations(): void {
    const defaultIntegrations: ChatbotIntegration[] = [
      {
        id: 'dialogflow-basic',
        name: 'Dialogflow Basic',
        provider: 'dialogflow',
        isActive: true,
        config: {
          apiKey: 'mock_dialogflow_key',
          endpoint: 'https://dialogflow.googleapis.com/v2/projects/mock-project/agent/sessions',
          model: 'dialogflow-es',
        },
      },
      {
        id: 'azure-bot',
        name: 'Azure Bot Service',
        provider: 'azure',
        isActive: true,
        config: {
          apiKey: 'mock_azure_key',
          endpoint: 'https://mock-bot.azurewebsites.net/api/messages',
          model: 'azure-bot-framework',
        },
      },
      {
        id: 'aws-lex',
        name: 'AWS Lex',
        provider: 'aws',
        isActive: true,
        config: {
          apiKey: 'mock_aws_key',
          endpoint: 'https://runtime.lex.us-east-1.amazonaws.com',
          model: 'lex-v2',
        },
      },
      {
        id: 'custom-webhook',
        name: 'Custom Webhook',
        provider: 'custom',
        isActive: false,
        config: {
          apiKey: 'mock_custom_key',
          endpoint: 'https://api.example.com/webhook',
        },
      },
    ];

    defaultIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });
  }

  getAvailableIntegrations(): ChatbotIntegration[] {
    return Array.from(this.integrations.values());
  }

  getActiveIntegrations(): ChatbotIntegration[] {
    return Array.from(this.integrations.values()).filter(integration => integration.isActive);
  }

  async addIntegration(integration: Omit<ChatbotIntegration, 'id'>): Promise<string> {
    const id = `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newIntegration: ChatbotIntegration = {
      id,
      ...integration,
    };

    this.integrations.set(id, newIntegration);
    return id;
  }

  async updateIntegration(id: string, updates: Partial<ChatbotIntegration>): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    const updatedIntegration = { ...integration, ...updates };
    this.integrations.set(id, updatedIntegration);
    return true;
  }

  async removeIntegration(id: string): Promise<boolean> {
    return this.integrations.delete(id);
  }

  async processMessage(
    message: string,
    integrationId: string,
    context?: Record<string, any>
  ): Promise<ChatbotResponse> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        error: 'Integración no encontrada',
      };
    }

    if (!integration.isActive) {
      return {
        success: false,
        error: 'La integración no está activa',
      };
    }

    try {
      const provider = this.providerFactory.getProvider(integration.provider);
      if (!provider) {
        return {
          success: false,
          error: 'Proveedor no soportado',
        };
      }

      return await provider.processMessage(message, integration.config, context);
    } catch (error) {
      console.error('Error processing message with chatbot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        fallbackUsed: true,
      };
    }
  }

  setFallbackTemplate(integrationId: string, templateContent: string): void {
    this.fallbackTemplates.set(integrationId, templateContent);
  }

  getFallbackTemplate(integrationId: string): string | null {
    return this.fallbackTemplates.get(integrationId) || null;
  }

  async testIntegration(integrationId: string, testMessage: string): Promise<ChatbotResponse> {
    return await this.processMessage(testMessage, integrationId);
  }

  getIntegration(id: string): ChatbotIntegration | null {
    return this.integrations.get(id) || null;
  }
}

export const chatbotService = new ChatbotService();




