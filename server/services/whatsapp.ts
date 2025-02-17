import { storage } from "../storage";
import { Message, Template, InsertMessage } from "@shared/schema";
import twilio from 'twilio';

// Initialize Twilio client for SMS fallback
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

export async function initializeWhatsApp() {
  if (!WHATSAPP_API_KEY) {
    console.warn('WhatsApp API key not configured. WhatsApp messaging will be simulated.');
    return false;
  }
  return true;
}

export async function sendWhatsAppMessage(message: Message, template?: Template) {
  try {
    const isWhatsAppConfigured = await initializeWhatsApp();
    let messageContent = message.content;

    // Process template if provided
    if (template && template.variables) {
      messageContent = processTemplate(template, message);
    }

    if (!isWhatsAppConfigured) {
      // Try SMS fallback if WhatsApp is not available
      if (twilioClient) {
        return await sendSMSFallback(message);
      }

      // Simulate message sending in development
      console.log('Simulating WhatsApp/SMS message:', {
        ...message,
        content: messageContent
      });

      return {
        ...message,
        content: messageContent,
        status: 'sent'
      };
    }

    // Attempt WhatsApp delivery
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
          body: messageContent
        }
      })
    });

    if (!response.ok) {
      // If WhatsApp fails, try SMS fallback
      if (twilioClient) {
        return await sendSMSFallback(message);
      }
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      ...message,
      content: messageContent,
      status: 'sent',
      metadata: result
    };
  } catch (error) {
    console.error('Error sending WhatsApp/SMS message:', error);
    throw new Error('Failed to send message');
  }
}

async function sendSMSFallback(message: Message): Promise<Message> {
  if (!twilioClient) {
    throw new Error('Twilio not configured for SMS fallback');
  }

  try {
    const result = await twilioClient.messages.create({
      body: message.content,
      to: message.recipient,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    const smsMessage: InsertMessage = {
      userId: message.userId,
      phoneNumberId: message.phoneNumberId,
      type: 'SMS',
      content: message.content,
      recipient: message.recipient,
      status: 'sent',
      createdAt: new Date()
    };

    // Create a new message record for the SMS fallback
    return await storage.createMessage(smsMessage);
  } catch (error) {
    console.error('SMS fallback failed:', error);
    throw new Error('Failed to send SMS fallback');
  }
}

function processTemplate(template: Template, message: Message): string {
  let content = template.content;
  const variables = template.variables as Record<string, string>;

  // Replace template variables with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    // Add support for common dynamic fields
    const dynamicValue = getDynamicValue(key, message) || value;
    content = content.replace(new RegExp(placeholder, 'g'), dynamicValue);
  });

  return content;
}

function getDynamicValue(key: string, message: Message): string | null {
  // Add support for common dynamic fields like business name, CTA links, etc.
  const dynamicFields: Record<string, () => string> = {
    'business_name': () => 'Your Business', // This should come from user settings
    'cta_link': () => `https://booking.example.com/${message.recipient}`,
    'timestamp': () => new Date().toLocaleString(),
  };

  return dynamicFields[key]?.() || null;
}

export async function handleIncomingWhatsApp(payload: any) {
  try {
    if (!payload.userId || !payload.phoneNumberId || !payload.content || !payload.from) {
      throw new Error('Invalid webhook payload');
    }

    const message: InsertMessage = {
      userId: payload.userId,
      phoneNumberId: payload.phoneNumberId,
      type: 'WhatsApp',
      content: payload.content,
      recipient: payload.from,
      status: 'received',
      createdAt: new Date()
    };

    return await storage.createMessage(message);
  } catch (error) {
    console.error('Error handling incoming WhatsApp:', error);
    throw new Error('Failed to process incoming WhatsApp message');
  }
}