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

export async function handleIncomingCall(callData: {
  From: string;
  To: string;
  CallSid: string;
  CallStatus: string;
}) {
  try {
    // 1. Get the phone number details to find the associated location
    const phoneNumbers = await storage.getPhoneNumbers(1); // Replace with actual user ID
    const phoneNumber = phoneNumbers.find(pn => pn.number === callData.To);

    if (!phoneNumber) {
      throw new Error('Phone number not found');
    }

    // 2. Create call record
    const call = await storage.createCall({
      userId: phoneNumber.userId,
      phoneNumberId: phoneNumber.id,
      callerNumber: callData.From,
      status: callData.CallStatus === 'completed' ? 'answered' : 'missed',
      duration: 0,
      createdAt: new Date(),
      routedToLocation: phoneNumber.locationId,
      callType: 'direct'
    });

    // 3. Send notification to Slack
    await sendCallNotification(call);

    // 4. If call is missed, send WhatsApp message
    if (call.status === 'missed') {
      // Get location templates
      const templates = await storage.getLocationTemplates(phoneNumber.locationId);
      const missedCallTemplate = templates.find(t => t.type === 'missed_call');

      if (missedCallTemplate) {
        // Create and send WhatsApp message
        const message = await storage.createMessage({
          userId: phoneNumber.userId,
          phoneNumberId: phoneNumber.id,
          type: 'WhatsApp',
          content: missedCallTemplate.content,
          recipient: callData.From,
          status: 'pending',
          createdAt: new Date()
        });

        await sendWhatsAppMessage(message, missedCallTemplate);
      }
    }

    return call;
  } catch (error) {
    console.error('Error handling incoming call:', error);
    throw new Error('Failed to process incoming call');
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