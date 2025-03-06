import twilio from 'twilio';
import { storage } from '../storage';
import { Message, Template, InsertMessage, PhoneNumber } from "@shared/schema";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('Twilio credentials not configured. SMS, WhatsApp and call functionality will be simulated.');
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

// Enhanced call handling with better classification
export async function handleIncomingCall(callData: {
  From: string;
  To: string;
  CallSid: string;
  CallStatus: string;
  ForwardedFrom?: string;
  DialogueSid?: string;
}) {
  try {
    // 1. Get the phone number details to find the associated location
    const phoneNumber = await storage.getPhoneNumberByNumber(callData.To);

    if (!phoneNumber) {
      throw new Error('Phone number not found');
    }

    // 2. Classify call status
    const callStatus = classifyCallStatus(callData.CallStatus);

    // 3. Create detailed call record
    const call = await storage.createCall({
      userId: phoneNumber.userId,
      phoneNumberId: phoneNumber.id,
      callerNumber: callData.From,
      status: callStatus,
      duration: 0, // This will be updated on call completion
      createdAt: new Date(),
      routedToLocation: phoneNumber.locationId,
      callType: determineCallType(callData)
    });

    // 4. Handle missed calls with notification
    if (callStatus === 'missed') {
      await handleMissedCall(call, phoneNumber);
    }

    return call;
  } catch (error) {
    console.error('Error handling incoming call:', error);
    throw new Error('Failed to process incoming call');
  }
}

function classifyCallStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'answered',
    'no-answer': 'missed',
    'busy': 'missed',
    'failed': 'missed',
    'canceled': 'missed'
  };
  return statusMap[twilioStatus] || 'missed';
}

function determineCallType(callData: any): string {
  if (callData.ForwardedFrom) return 'forwarded';
  if (callData.DialogueSid) return 'ivr';
  return 'direct';
}

async function handleMissedCall(call: any, phoneNumber: PhoneNumber) {
  try {
    // Get location details and template
    const template = await storage.getTemplateByType(phoneNumber.locationId, 'missed_call');
    if (!template) {
      console.log('No template found for missed call notification');
      return;
    }

    // Get user/company details
    const user = await storage.getUser(phoneNumber.userId);
    if (!user) {
      console.log('User not found for missed call notification');
      return;
    }

    // Prepare template variables
    const variables = {
      company_name: user.companyName,
      phone_number: phoneNumber.number,
      caller_number: call.callerNumber,
      ...template.variables
    };

    // Send notification using the preferred channel
    await sendMessage({
      userId: call.userId,
      phoneNumberId: call.phoneNumberId,
      type: phoneNumber.channel === 'whatsapp' ? 'WhatsApp' : 'SMS',
      content: processTemplate(template, variables),
      recipient: call.callerNumber,
      template
    });

  } catch (error) {
    console.error('Error handling missed call notification:', error);
  }
}

// Send message (SMS or WhatsApp)
export async function sendMessage(message: {
  userId: number;
  phoneNumberId: number;
  type: 'SMS' | 'WhatsApp';
  content: string;
  recipient: string;
  template?: Template;
}) {
  if (!client) {
    console.log('Simulating message:', message);
    return message;
  }

  try {
    let from = TWILIO_PHONE_NUMBER;
    let to = message.recipient;

    // If it's a WhatsApp message, prefix the numbers with "whatsapp:"
    if (message.type === 'WhatsApp') {
      from = `whatsapp:${TWILIO_PHONE_NUMBER}`;
      to = `whatsapp:${message.recipient}`;
    }

    const result = await client.messages.create({
      body: message.content,
      to,
      from
    });

    return await storage.createMessage({
      userId: message.userId,
      phoneNumberId: message.phoneNumberId,
      type: message.type,
      content: message.content,
      recipient: message.recipient,
      status: 'sent',
      createdAt: new Date(),
      metadata: result
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error(`Failed to send ${message.type} message`);
  }
}

function processTemplate(template: Template, variables: Record<string, string>): string {
  let content = template.content;

  // Replace template variables with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return content;
}

export async function getTwilioCallToken() {
  if (!client) {
    return { token: 'simulated-token' };
  }

  const capability = new twilio.jwt.ClientCapability({
    accountSid: TWILIO_ACCOUNT_SID!,
    authToken: TWILIO_AUTH_TOKEN!
  });

  capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope('test'));
  capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
    applicationSid: TWILIO_ACCOUNT_SID!,
    clientName: 'test'
  }));

  return {
    token: capability.toJwt()
  };
}