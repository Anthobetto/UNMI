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
}) {
  try {
    console.log('Handling incoming call:', callData);

    // 1. Get the phone number details to find the associated location
    const phoneNumber = await storage.getPhoneNumberByNumber(callData.To);
    if (!phoneNumber) {
      console.error('Phone number not found:', callData.To);
      throw new Error('Phone number not found');
    }

    // 2. Classify call status
    const callStatus = classifyCallStatus(callData.CallStatus);
    console.log('Classified call status:', callStatus);

    // 3. Create detailed call record
    const call = await storage.createCall({
      userId: phoneNumber.userId,
      phoneNumberId: phoneNumber.id,
      callerNumber: callData.From,
      status: callStatus,
      duration: 0,
      createdAt: new Date(),
      routedToLocation: phoneNumber.locationId,
      callType: 'direct'
    });

    // 4. Handle missed calls with notification
    if (callStatus === 'missed') {
      console.log('Processing missed call notification for call:', call.id);
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

async function handleMissedCall(call: any, phoneNumber: PhoneNumber) {
  try {
    console.log('Getting template for missed call notification');
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
      company_name: user.companyName || user.username, // Fallback to username if companyName not set
      phone_number: phoneNumber.number,
      caller_number: call.callerNumber,
      ...template.variables
    };

    console.log('Sending notification with variables:', variables);

    // Determine message type based on phone number channel preference
    const messageType = phoneNumber.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    console.log('Selected message type:', messageType);

    // Send notification using the preferred channel
    await sendMessage({
      userId: call.userId,
      phoneNumberId: call.phoneNumberId,
      type: messageType,
      content: processTemplate(template, variables),
      recipient: call.callerNumber,
      template
    });

  } catch (error) {
    console.error('Error handling missed call notification:', error);
    throw error;
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
  console.log('Attempting to send message:', {
    type: message.type,
    recipient: message.recipient,
    contentLength: message.content.length
  });

  if (!client) {
    console.log('Simulating message in development:', message);
    return message;
  }

  try {
    let from = TWILIO_PHONE_NUMBER;
    let to = message.recipient;

    // If it's a WhatsApp message, prefix the numbers with "whatsapp:"
    if (message.type === 'WhatsApp') {
      from = `whatsapp:${TWILIO_PHONE_NUMBER}`;
      to = `whatsapp:${message.recipient}`;
      console.log('Configured WhatsApp numbers:', { from, to });
    }

    const result = await client.messages.create({
      body: message.content,
      to,
      from
    });

    console.log('Message sent successfully:', result.sid);

    // Store message record
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

  console.log('Processed template content:', content);
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