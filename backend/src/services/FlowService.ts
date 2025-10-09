/**
 * FlowService - Post-Call Automation & Conditional Section Logic
 * 
 * Handles:
 * - Post-missed-call triggers
 * - Conditional visibility: Templates vs Chatbots
 * - Auto-template completion & sending
 * - Chatbot routing & connection
 * 
 * SOLID Principles:
 * - SRP: Only handles flow orchestration
 * - DIP: Depends on ProviderService abstraction
 */

import { providerService } from './ProviderService';
import { z } from 'zod';

// ==========================================
// SCHEMAS
// ==========================================

export const userFlowPreferencesSchema = z.object({
  userId: z.string(),
  preferredFlow: z.enum(['templates', 'chatbot', 'both']),
  autoActivateTemplates: z.boolean().default(false),
  autoActivateChatbot: z.boolean().default(false),
  defaultTemplateId: z.string().optional(),
  defaultChatbotId: z.string().optional(),
});

export type UserFlowPreferences = z.infer<typeof userFlowPreferencesSchema>;

export const postCallEventSchema = z.object({
  callId: z.string(),
  userId: z.string(),
  locationId: z.number(),
  virtualNumber: z.string(),
  callerNumber: z.string(),
  callType: z.enum(['missed', 'answered', 'voicemail']),
  timestamp: z.string(),
  duration: z.number().optional(),
});

export type PostCallEvent = z.infer<typeof postCallEventSchema>;

export const templateCompletionSchema = z.object({
  templateId: z.string(),
  userId: z.string(),
  locationId: z.number(),
  recipientNumber: z.string(),
  variables: z.record(z.string()).optional(),
  sendImmediately: z.boolean().default(false),
});

export type TemplateCompletion = z.infer<typeof templateCompletionSchema>;

// ==========================================
// FLOW SERVICE
// ==========================================

export class FlowService {
  // In-memory mock storage (replace with Supabase in production)
  private userPreferences: Map<string, UserFlowPreferences> = new Map();
  private callEvents: PostCallEvent[] = [];
  private templateCompletions: Map<string, any> = new Map();

  /**
   * Get user's flow preferences (determines which sections are visible)
   */
  async getUserFlowPreferences(userId: string): Promise<UserFlowPreferences> {
    // In production: SELECT from user_flow_preferences table
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Default preferences for new users
      preferences = {
        userId,
        preferredFlow: 'templates', // Default to templates flow
        autoActivateTemplates: false,
        autoActivateChatbot: false,
      };
      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  /**
   * Update user's flow preferences
   */
  async updateUserFlowPreferences(preferences: UserFlowPreferences): Promise<void> {
    // In production: UPDATE user_flow_preferences table
    this.userPreferences.set(preferences.userId, preferences);
    console.log(`✅ Flow preferences updated for user ${preferences.userId}: ${preferences.preferredFlow}`);
  }

  /**
   * Handle post-missed-call trigger
   * This is the main orchestration method
   */
  async handleMissedCall(event: PostCallEvent): Promise<{
    success: boolean;
    actionsTriggered: string[];
    errors: string[];
  }> {
    const actionsTriggered: string[] = [];
    const errors: string[] = [];

    console.log(`\n📞 [FlowService] Processing missed call: ${event.callId}`);
    
    // Store call event
    this.callEvents.push(event);

    // Get user preferences
    const preferences = await this.getUserFlowPreferences(event.userId);

    // ==========================================
    // CONDITIONAL FLOW LOGIC
    // ==========================================

    if (preferences.preferredFlow === 'templates' || preferences.preferredFlow === 'both') {
      // TEMPLATES FLOW: Auto-complete and send template
      if (preferences.autoActivateTemplates && preferences.defaultTemplateId) {
        try {
          const result = await this.autoCompleteAndSendTemplate({
            templateId: preferences.defaultTemplateId,
            userId: event.userId,
            locationId: event.locationId,
            recipientNumber: event.callerNumber,
            sendImmediately: true,
          });

          if (result.success) {
            actionsTriggered.push('template-sent');
            console.log(`✅ Auto-sent template to ${event.callerNumber}`);
          } else {
            errors.push(`Template send failed: ${result.error}`);
          }
        } catch (error: any) {
          errors.push(`Template error: ${error.message}`);
        }
      } else {
        actionsTriggered.push('template-section-shown');
        console.log(`📋 Templates section available for manual completion`);
      }
    }

    if (preferences.preferredFlow === 'chatbot' || preferences.preferredFlow === 'both') {
      // CHATBOT FLOW: Auto-route to bot
      if (preferences.autoActivateChatbot && preferences.defaultChatbotId) {
        try {
          const result = await this.autoRouteToChatbot(
            preferences.defaultChatbotId,
            event.userId,
            `Missed call from ${event.callerNumber}`
          );

          if (result.success) {
            actionsTriggered.push('chatbot-routed');
            console.log(`✅ Auto-routed to chatbot ${preferences.defaultChatbotId}`);
          } else {
            errors.push(`Chatbot routing failed: ${result.error}`);
          }
        } catch (error: any) {
          errors.push(`Chatbot error: ${error.message}`);
        }
      } else {
        actionsTriggered.push('chatbot-section-shown');
        console.log(`🤖 Chatbots section available for manual connection`);
      }
    }

    return {
      success: errors.length === 0,
      actionsTriggered,
      errors,
    };
  }

  /**
   * Auto-complete and send template
   */
  async autoCompleteAndSendTemplate(completion: TemplateCompletion): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // In production: 
    // 1. SELECT template from templates table
    // 2. Replace variables
    // 3. Call ProviderService to send via WhatsApp/SMS
    // 4. INSERT into messages table

    const templateMessage = `Hello! You missed a call from our store. We'd love to help you. Reply to this message or call us back.`;

    // Send via provider (default WhatsApp)
    const result = await providerService.sendWhatsApp(
      completion.recipientNumber,
      templateMessage
    );

    if (result.success) {
      // Store completion record
      this.templateCompletions.set(completion.templateId, {
        ...completion,
        sentAt: new Date().toISOString(),
        messageId: result.messageId,
      });
    }

    return result;
  }

  /**
   * Auto-route to chatbot
   */
  async autoRouteToChatbot(botId: string, userId: string, initialMessage?: string): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    // Call ProviderService to route to chatbot
    return await providerService.routeToBot(botId, userId, initialMessage);
  }

  /**
   * Get call events for a user (for dashboard display)
   */
  async getUserCallEvents(userId: string, limit: number = 50): Promise<PostCallEvent[]> {
    // In production: SELECT from calls table
    return this.callEvents
      .filter(event => event.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get template completion history
   */
  async getTemplateCompletions(userId: string): Promise<any[]> {
    // In production: SELECT from template_completions table
    return Array.from(this.templateCompletions.values())
      .filter((c: any) => c.userId === userId);
  }

  /**
   * Determine which sections should be visible for a user
   */
  async getVisibleSections(userId: string): Promise<{
    templates: boolean;
    chatbots: boolean;
    both: boolean;
  }> {
    const preferences = await this.getUserFlowPreferences(userId);

    return {
      templates: preferences.preferredFlow === 'templates' || preferences.preferredFlow === 'both',
      chatbots: preferences.preferredFlow === 'chatbot' || preferences.preferredFlow === 'both',
      both: preferences.preferredFlow === 'both',
    };
  }
}

// Singleton instance
export const flowService = new FlowService();

