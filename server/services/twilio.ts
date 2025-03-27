import twilio from 'twilio';
import { storage } from '../storage';
import { sendWhatsAppMessage } from './whatsapp';
import { sendCallNotification } from './slack';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn('Twilio credentials not configured. Call functionality will be simulated.');
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
    const phoneNumbers = await storage.getPhoneNumbers(1); // Replace with actual user ID
    const phoneNumber = phoneNumbers.find(pn => pn.number === callData.To);

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

    // 4. Send notification to Slack for monitoring
    await sendCallNotification(call);

    // 5. Handle unanswered calls with messaging
    if (callStatus === 'missed') {
      await handleMissedCall(phoneNumber.locationId, phoneNumber.id, call);
    }

    return call;
  } catch (error) {
    console.error('Error handling incoming call:', error);
    throw new Error('Failed to process incoming call');
  }
}

function classifyCallStatus(twilioStatus: string): string {
  // Map Twilio call statuses to our system statuses
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
  // Determine if call is direct, forwarded, or IVR based
  if (callData.ForwardedFrom) return 'forwarded';
  if (callData.DialogueSid) return 'ivr';
  return 'direct';
}

async function handleMissedCall(locationId: number, phoneNumberId: number, call: any) {
  try {
    // 1. Get location templates
    const templates = await storage.getLocationTemplates(locationId);
    const missedCallTemplate = templates.find(t => t.type === 'missed_call');

    if (missedCallTemplate) {
      // 2. Create message with template
      const message = await storage.createMessage({
        userId: call.userId,
        phoneNumberId: phoneNumberId,
        type: 'WhatsApp', // Will fallback to SMS if WhatsApp fails
        content: missedCallTemplate.content,
        recipient: call.callerNumber,
        status: 'pending',
        createdAt: new Date()
      });

      // 3. Send message with template
      await sendWhatsAppMessage(message, missedCallTemplate);
    }
  } catch (error) {
    console.error('Error handling missed call:', error);
    throw error;
  }
}

export async function getTwilioCallToken() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { token: 'simulated-token' };
  }

  const capability = new twilio.jwt.ClientCapability({
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN
  });

  capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope('test'));
  capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
    applicationSid: TWILIO_ACCOUNT_SID,
    clientName: 'test'
  }));

  return {
    token: capability.toJwt()
  };
}