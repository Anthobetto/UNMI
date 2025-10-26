// Re-export shared types
export type {
  User,
  Location,
  Template,
  TemplateType,
  MessageChannel,
  PhoneNumber,
  Call,
  CallStatus,
  CallType,
  Message,
  MessageType,
  MessageStatus,
  RoutingRule,
  LoginData,
  RegisterData,
  CreateLocationData,
  CreateTemplateData,
} from '../../../shared/schema';

// Frontend-specific types

// Analytics and metrics
export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  recoveryRate: number;
  averageResponseTime: number;
  peakHours: string[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  potentialRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  messagesSent: number;
  revenuePerMessage: number;
}

// Plan and subscription types
export interface Plan {
  id: string;
  name: string;
  type: 'templates' | 'chatbots';
  price: number;
  features: string[];
  messageLimit: number;
  extraMessagePrice: number;
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Chatbot integration types
export interface Chatbot {
  id: string;
  name: string;
  provider: 'custom' | 'dialogflow' | 'azure' | 'aws';
  config: ChatbotConfig;
  isActive: boolean;
  fallbackTemplate?: number;
}

export interface ChatbotConfig {
  apiKey: string;
  endpoint: string;
  model?: string;
  parameters?: Record<string, any>;
}

export interface ChatbotResponse {
  success: boolean;
  response?: string;
  error?: string;
  confidence?: number;
  fallbackUsed?: boolean;
}

export interface ChatbotIntegration {
  id: string;
  name: string;
  provider: 'custom' | 'dialogflow' | 'azure' | 'aws';
  isActive: boolean;
  config: ChatbotConfig;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface PlanSelectionForm {
  planType: 'templates' | 'chatbots';
  planId: string;
  paymentMethod: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Stripe Mock Types
export interface StripeSession {
  id: string;
  url: string;
  planType: 'templates' | 'chatbots';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}

// Message Recovery Types
export interface MessageRequest {
  recipient: string;
  content: string;
  channel: 'sms' | 'whatsapp' | 'both';
  templateId?: number;
  variables?: Record<string, string>;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}




