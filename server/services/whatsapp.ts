import { storage } from "../storage";
import { Message } from "@shared/schema";

// Check for WhatsApp API key in environment variables
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

export async function initializeWhatsApp() {
  if (!WHATSAPP_API_KEY) {
    console.warn('WhatsApp API key not configured. WhatsApp messaging will be simulated.');
    return false;
  }
  return true;
}

export async function sendWhatsAppMessage(message: Message) {
  try {
    const isWhatsAppConfigured = await initializeWhatsApp();

    if (!isWhatsAppConfigured) {
      // Simulate message sending in development
      console.log('Simulating WhatsApp message:', message);

      // Create a simulated successful response
      const updatedMessage = {
        ...message,
        status: 'sent'
      };

      return updatedMessage;
    }

    // Real WhatsApp API implementation
    const response = await fetch('https://api.whatsapp.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: message.recipient,
        type: 'text',
        text: {
          body: message.content
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      ...message,
      status: 'sent',
      metadata: result
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error('Failed to send WhatsApp message');
  }
}

export async function handleIncomingWhatsApp(payload: any) {
  try {
    // Validate webhook payload
    if (!payload.userId || !payload.phoneNumberId || !payload.content || !payload.from) {
      throw new Error('Invalid webhook payload');
    }

    // Process incoming WhatsApp message
    const message = await storage.createMessage({
      userId: payload.userId,
      phoneNumberId: payload.phoneNumberId,
      type: 'WhatsApp',
      content: payload.content,
      recipient: payload.from,
      status: 'received',
      createdAt: new Date()
    });

    // Broadcast to connected WebSocket clients
    // This will be handled by the WebSocket server in routes.ts
    return message;
  } catch (error) {
    console.error('Error handling incoming WhatsApp:', error);
    throw new Error('Failed to process incoming WhatsApp message');
  }
}