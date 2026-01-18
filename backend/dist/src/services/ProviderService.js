/**
 * ProviderService - Multi-Provider Abstraction Layer
 *
 * SOLID Principles Applied:
 * - SRP: Handles only provider operations (messaging, virtual numbers, chatbot routing)
 * - OCP: Open for extension (new providers), closed for modification
 * - LSP: All providers implement the same interface
 * - ISP: Clean interface segregation for different capabilities
 * - DIP: Depend on abstractions (ProviderPlugin), not concrete implementations
 */
// ==========================================
// MOCK PROVIDERS (Extensible for real implementations)
// ==========================================
class TwilioProvider {
    name = 'twilio';
    isActive = true;
    capabilities = ['messaging', 'virtual_numbers'];
    async sendSMS(to, message) {
        console.log(`[Twilio Mock] Sending SMS to ${to}: ${message}`);
        return { success: true, messageId: `twilio-sms-${Date.now()}` };
    }
    async sendWhatsApp(to, message) {
        console.log(`[Twilio Mock] Sending WhatsApp to ${to}: ${message}`);
        return { success: true, messageId: `twilio-wa-${Date.now()}` };
    }
    async generateVirtualNumber(countryCode) {
        console.log(`[Twilio Mock] Generating virtual number for ${countryCode}`);
        const number = `+${countryCode}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        return { success: true, number };
    }
    async releaseVirtualNumber(number) {
        console.log(`[Twilio Mock] Releasing virtual number ${number}`);
        return { success: true };
    }
}
class VonageProvider {
    name = 'vonage';
    isActive = true;
    capabilities = ['messaging', 'virtual_numbers'];
    async sendSMS(to, message) {
        console.log(`[Vonage Mock] Sending SMS to ${to}: ${message}`);
        return { success: true, messageId: `vonage-sms-${Date.now()}` };
    }
    async sendWhatsApp(to, message) {
        console.log(`[Vonage Mock] Sending WhatsApp to ${to}: ${message}`);
        return { success: true, messageId: `vonage-wa-${Date.now()}` };
    }
    async generateVirtualNumber(countryCode) {
        console.log(`[Vonage Mock] Generating virtual number for ${countryCode}`);
        const number = `+${countryCode}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        return { success: true, number };
    }
    async releaseVirtualNumber(number) {
        console.log(`[Vonage Mock] Releasing virtual number ${number}`);
        return { success: true };
    }
}
class ChatbotProvider {
    name = 'unmi-chatbot';
    isActive = true;
    capabilities = ['chatbot'];
    async routeToBot(botId, userId, initialMessage) {
        console.log(`[Chatbot Mock] Routing user ${userId} to bot ${botId} with message: ${initialMessage}`);
        return { success: true, sessionId: `bot-session-${Date.now()}` };
    }
    async disconnectBot(sessionId) {
        console.log(`[Chatbot Mock] Disconnecting bot session ${sessionId}`);
        return { success: true };
    }
}
// ==========================================
// PROVIDER SERVICE (OCP - Open for Extension)
// ==========================================
export class ProviderService {
    providers = new Map();
    defaultMessagingProvider = 'twilio';
    defaultVirtualNumberProvider = 'twilio';
    defaultChatbotProvider = 'unmi-chatbot';
    constructor() {
        // Register available providers
        this.registerProvider(new TwilioProvider());
        this.registerProvider(new VonageProvider());
        this.registerProvider(new ChatbotProvider());
    }
    /**
     * Register a new provider (OCP: Open for extension)
     */
    registerProvider(provider) {
        this.providers.set(provider.name, provider);
        console.log(`✅ Provider registered: ${provider.name} (${provider.capabilities.join(', ')})`);
    }
    /**
     * Get provider by name
     */
    getProvider(name) {
        return this.providers.get(name);
    }
    /**
     * Get all active providers
     */
    getActiveProviders() {
        return Array.from(this.providers.values()).filter(p => p.isActive);
    }
    /**
     * Set default provider for a capability
     */
    setDefaultProvider(capability, providerName) {
        const provider = this.providers.get(providerName);
        if (!provider || !provider.capabilities.includes(capability)) {
            throw new Error(`Provider ${providerName} does not support ${capability}`);
        }
        switch (capability) {
            case 'messaging':
                this.defaultMessagingProvider = providerName;
                break;
            case 'virtual_numbers':
                this.defaultVirtualNumberProvider = providerName;
                break;
            case 'chatbot':
                this.defaultChatbotProvider = providerName;
                break;
        }
        console.log(`✅ Default ${capability} provider set to: ${providerName}`);
    }
    // ==========================================
    // MESSAGING METHODS
    // ==========================================
    async sendSMS(to, message, providerName) {
        const provider = this.providers.get(providerName || this.defaultMessagingProvider);
        if (!provider || !provider.sendSMS) {
            return { success: false, error: 'Messaging provider not available' };
        }
        try {
            return await provider.sendSMS(to, message);
        }
        catch (error) {
            console.error(`[ProviderService] SMS send failed:`, error);
            return { success: false, error: error.message };
        }
    }
    async sendWhatsApp(to, message, providerName) {
        const provider = this.providers.get(providerName || this.defaultMessagingProvider);
        if (!provider || !provider.sendWhatsApp) {
            return { success: false, error: 'WhatsApp provider not available' };
        }
        try {
            return await provider.sendWhatsApp(to, message);
        }
        catch (error) {
            console.error(`[ProviderService] WhatsApp send failed:`, error);
            return { success: false, error: error.message };
        }
    }
    // ==========================================
    // VIRTUAL NUMBER METHODS
    // ==========================================
    async generateVirtualNumber(countryCode = '34', providerName) {
        const provider = this.providers.get(providerName || this.defaultVirtualNumberProvider);
        if (!provider || !provider.generateVirtualNumber) {
            return { success: false, error: 'Virtual number provider not available' };
        }
        try {
            return await provider.generateVirtualNumber(countryCode);
        }
        catch (error) {
            console.error(`[ProviderService] Virtual number generation failed:`, error);
            return { success: false, error: error.message };
        }
    }
    async releaseVirtualNumber(number, providerName) {
        const provider = this.providers.get(providerName || this.defaultVirtualNumberProvider);
        if (!provider || !provider.releaseVirtualNumber) {
            return { success: false, error: 'Virtual number provider not available' };
        }
        try {
            return await provider.releaseVirtualNumber(number);
        }
        catch (error) {
            console.error(`[ProviderService] Virtual number release failed:`, error);
            return { success: false, error: error.message };
        }
    }
    // ==========================================
    // CHATBOT METHODS
    // ==========================================
    async routeToBot(botId, userId, initialMessage, providerName) {
        const provider = this.providers.get(providerName || this.defaultChatbotProvider);
        if (!provider || !provider.routeToBot) {
            return { success: false, error: 'Chatbot provider not available' };
        }
        try {
            return await provider.routeToBot(botId, userId, initialMessage);
        }
        catch (error) {
            console.error(`[ProviderService] Bot routing failed:`, error);
            return { success: false, error: error.message };
        }
    }
    async disconnectBot(sessionId, providerName) {
        const provider = this.providers.get(providerName || this.defaultChatbotProvider);
        if (!provider || !provider.disconnectBot) {
            return { success: false, error: 'Chatbot provider not available' };
        }
        try {
            return await provider.disconnectBot(sessionId);
        }
        catch (error) {
            console.error(`[ProviderService] Bot disconnect failed:`, error);
            return { success: false, error: error.message };
        }
    }
}
// Singleton instance
export const providerService = new ProviderService();
