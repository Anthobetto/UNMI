// Type definitions for our application data

// User interface
export interface User {
  id: number;
  username: string;
  password: string; // Stores hashed password
  companyName: string;
  createdAt: Date;
}

// Group interface
export interface Group {
  id: number;
  userId: number;
  name: string;
  sharedNumber?: string;
  active: boolean;
}

// Location interface
export interface Location {
  id: number;
  userId: number;
  groupId?: number;
  name: string;
  address: string;
  timezone: string;
  businessHours?: any;
  trialStartDate?: Date;
  isFirstLocation: boolean;
  paymentIntentId?: string;
  active: boolean;
  createdAt: Date;
}

// Phone number interface
export interface PhoneNumber {
  id: number;
  userId: number;
  locationId: number;
  number: string;
  type: string; // 'fixed', 'mobile', 'shared'
  linkedNumber?: string;
  channel: string; // 'whatsapp', 'sms', or 'both'
  active: boolean;
  forwardingEnabled: boolean;
  createdAt: Date;
}

// Template interface
export interface Template {
  id: number;
  userId: number;
  locationId?: number;
  groupId?: number;
  name: string;
  content: string;
  type: string; // 'missed_call', 'after_hours', 'welcome'
  channel: string; // 'whatsapp', 'sms', or 'both'
  variables?: any;
  createdAt: Date;
}

// Message interface
export interface Message {
  id: number;
  userId: number;
  phoneNumberId: number;
  type: string; // 'SMS' or 'WhatsApp'
  content: string;
  recipient: string;
  status: string;
  metadata?: any;
  createdAt: Date;
}

// Call interface
export interface Call {
  id: number;
  userId: number;
  phoneNumberId: number;
  callerNumber: string;
  status: string; // 'answered', 'missed', 'rejected'
  duration?: number; // in seconds
  routedToLocation?: number;
  callType?: string; // 'direct', 'forwarded', 'ivr'
  createdAt: Date;
}