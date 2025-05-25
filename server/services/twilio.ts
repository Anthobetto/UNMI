import 'dotenv/config';
import twilio from 'twilio';
import { storage } from '../storage';
import { sendWhatsAppMessage } from './whatsapp';
import { sendCallNotification } from './slack';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured. Call functionality will be simulated.');
}

const client = twilio(accountSid, authToken);

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
    const phoneNumbers = await storage.getPhoneNumbers(22); // Replace with actual user ID
    console.log("📞 Números de teléfono obtenidos:", phoneNumbers);
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

async function handleMissedCall(locationId: number, phoneNumberId: number, call: any) {
  try {
    const templates = await storage.getLocationTemplates(locationId);
    const missedCallTemplate = templates.find(t => t.type === 'missed_call');

    if (missedCallTemplate) {
      const message = await storage.createMessage({
        userId: call.userId,
        phoneNumberId: phoneNumberId,
        type: 'WhatsApp',
        content: missedCallTemplate.content,
        recipient: call.callerNumber,
        status: 'pending',
        createdAt: new Date()
      });

      await sendWhatsAppMessage(message, missedCallTemplate);
    }
  } catch (error) {
    console.error('Error handling missed call:', error);
    throw error;
  }
}

export async function getTwilioCallToken() {
  if (!accountSid || !authToken) {
    return { token: 'simulated-token' };
  }

  const capability = new twilio.jwt.ClientCapability({
    accountSid: accountSid,
    authToken: authToken
  });

  capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope('test'));
  capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
    applicationSid: accountSid,
    clientName: 'test'
  }));

  return {
    token: capability.toJwt()
  };
}

export async function makeOutgoingCall(to: string, from: string, url: string) {
  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not configured. Simulating outgoing call.');
    return { sid: 'simulated-call-sid' };
  }

  try {
    const call = await client.calls.create({
      from,
      to,
      url,
    });
    console.log('Outgoing call SID:', call.sid);
    return call;
  } catch (error) {
    console.error('Error creating outgoing call:', error);
    throw error;
  }
}