// Supabase Service - Repository Pattern con SOLID
// Implementa SRP: Cada método tiene una responsabilidad única
import { supabase } from '../config/database';
export class SupabaseService {
    // ==================
    // USER OPERATIONS
    // ==================
    async getUserByAuthId(authId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authId)
                .single();
            if (error) {
                console.error('Error fetching user by auth_id:', error);
                return null;
            }
            return data ? this.mapUserFromDb(data) : null;
        }
        catch (error) {
            console.error('getUserByAuthId error:', error);
            return null;
        }
    }
    async getUserById(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                console.error('Error fetching user by id:', error);
                return null;
            }
            return data ? this.mapUserFromDb(data) : null;
        }
        catch (error) {
            console.error('getUserById error:', error);
            return null;
        }
    }
    async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                auth_id: userData.auth_id,
                username: userData.username,
                email: userData.email,
                company_name: userData.companyName,
                terms_accepted: userData.termsAccepted || false,
                terms_accepted_at: userData.termsAcceptedAt || new Date()
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
        return this.mapUserFromDb(data);
    }
    async updateUserPlan(userId, planType) {
        const { error } = await supabase
            .from('users')
            .update({ plan_type: planType })
            .eq('id', userId);
        if (error) {
            throw new Error(`Failed to update user plan: ${error.message}`);
        }
    }
    async handleUserLogin(email, password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError || !authData.session || !authData.user) {
            throw new Error('Invalid credentials');
        }
        const user = await this.getUserByAuthId(authData.user.id);
        if (!user)
            throw new Error('User record not found');
        const { data: purchasedLocations } = await supabase
            .from('purchased_locations')
            .select('*')
            .eq('user_id', user.id);
        const credits = purchasedLocations?.reduce((acc, pl) => {
            acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
            return acc;
        }, {}) || {};
        return {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            user: {
                ...user,
                purchasedLocations: purchasedLocations || [],
                credits,
            },
        };
    }
    // ==================
    // LOCATION OPERATIONS
    // ==================
    async getLocations(userId) {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching locations:', error);
            return [];
        }
        return data.map(this.mapLocationFromDb);
    }
    async getLocationById(locationId) {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('id', locationId)
            .single();
        if (error) {
            console.error('Error fetching location:', error);
            return null;
        }
        return data ? this.mapLocationFromDb(data) : null;
    }
    async createLocation(locationData) {
        if (!locationData.userId)
            throw new Error('Missing userId');
        if (!locationData.planType)
            throw new Error('Plan type is required');
        const userId = locationData.userId;
        const requestedPlan = locationData.planType;
        // ✅ Verificar que el usuario tenga créditos disponibles para el plan solicitado
        const available = await this.getAvailableLocations(userId, requestedPlan);
        if (available <= 0) {
            throw new Error(`No available locations for ${requestedPlan} plan. Please purchase more credits.`);
        }
        console.log(`✅ Creating location using ${requestedPlan} plan (${available} credits available)`);
        const { data, error } = await supabase
            .from('locations')
            .insert([{
                user_id: userId,
                group_id: locationData.groupId,
                name: locationData.name,
                address: locationData.address,
                timezone: locationData.timezone || 'UTC',
                business_hours: locationData.businessHours,
                is_first_location: locationData.isFirstLocation || false,
            }])
            .select()
            .single();
        if (error)
            throw new Error(`Failed to create location: ${error.message}`);
        await this.markLocationUsed(userId, requestedPlan);
        console.log(`✅ Location created and ${requestedPlan} credit used`);
        return this.mapLocationFromDb(data);
    }
    async updateLocation(id, data) {
        const { data: updated, error } = await supabase
            .from('locations')
            .update({
            name: data.name,
            address: data.address,
            timezone: data.timezone,
            business_hours: data.businessHours,
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to update location: ${error.message}`);
        return this.mapLocationFromDb(updated);
    }
    async recordPurchasedLocations(userId, selections) {
        if (!selections || selections.length === 0)
            return;
        // Preparar registros para upsert
        const records = selections.map(sel => ({
            user_id: userId,
            plan_type: sel.planType,
            quantity: sel.quantity,
            used: 0,
        }));
        // Upsert: si existe user_id + plan_type, suma quantity; si no existe, inserta
        for (const record of records) {
            const { data: existing, error: fetchError } = await supabase
                .from('purchased_locations')
                .select('*')
                .eq('user_id', userId)
                .eq('plan_type', record.plan_type)
                .single();
            if (fetchError && !fetchError.code?.includes('PGRST116')) {
                throw new Error(`Failed to check existing purchased locations: ${fetchError.message}`);
            }
            if (existing) {
                // Si existe, sumar la cantidad
                const { error: updateError } = await supabase
                    .from('purchased_locations')
                    .update({ quantity: existing.quantity + record.quantity })
                    .eq('id', existing.id);
                if (updateError)
                    throw new Error(`Failed to update purchased locations: ${updateError.message}`);
            }
            else {
                // Si no existe, insertar
                const { error: insertError } = await supabase
                    .from('purchased_locations')
                    .insert([record]);
                if (insertError)
                    throw new Error(`Failed to insert purchased locations: ${insertError.message}`);
            }
        }
    }
    async getAvailableLocations(userId, planType) {
        const { data: purchasedList, error } = await supabase
            .from('purchased_locations')
            .select('quantity, used')
            .eq('user_id', userId)
            .eq('plan_type', planType);
        if (error || !purchasedList)
            return 0;
        return purchasedList.reduce((sum, pl) => sum + ((pl.quantity || 0) - (pl.used || 0)), 0);
    }
    async markLocationUsed(userId, planType) {
        const { data: purchasedList, error } = await supabase
            .from('purchased_locations')
            .select('id, quantity, used')
            .eq('user_id', userId)
            .eq('plan_type', planType)
            .order('id', { ascending: true });
        if (error || !purchasedList || purchasedList.length === 0)
            throw new Error('No available purchased location to mark as used');
        const recordToUse = purchasedList.find(pl => (pl.quantity - (pl.used || 0)) > 0);
        if (!recordToUse)
            throw new Error('No available purchased location to mark as used');
        const { error: updateError } = await supabase
            .from('purchased_locations')
            .update({ used: (recordToUse.used || 0) + 1 })
            .eq('id', recordToUse.id);
        if (updateError)
            throw new Error(`Failed to mark purchased location as used: ${updateError.message}`);
    }
    // ==================
    // TEMPLATE OPERATIONS
    // ==================
    async getTemplates(userId) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
        return data.map(this.mapTemplateFromDb);
    }
    async getTemplateById(templateId) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .single();
        if (error) {
            console.error('Error fetching template:', error);
            return null;
        }
        return data ? this.mapTemplateFromDb(data) : null;
    }
    async createTemplate(templateData) {
        const { data, error } = await supabase
            .from('templates')
            .insert([{
                user_id: templateData.userId,
                location_id: templateData.locationId,
                group_id: templateData.groupId,
                name: templateData.name,
                content: templateData.content,
                type: templateData.type,
                channel: templateData.channel,
                variables: templateData.variables || {},
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create template: ${error.message}`);
        }
        return this.mapTemplateFromDb(data);
    }
    async updateTemplate(templateId, updates) {
        const { data, error } = await supabase
            .from('templates')
            .update({
            name: updates.name,
            content: updates.content,
            type: updates.type,
            channel: updates.channel,
            variables: updates.variables,
        })
            .eq('id', templateId)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update template: ${error.message}`);
        }
        return this.mapTemplateFromDb(data);
    }
    async deleteTemplate(templateId) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId);
        if (error) {
            throw new Error(`Failed to delete template: ${error.message}`);
        }
    }
    // ==================
    // CALL OPERATIONS
    // ==================
    async getCalls(userId) {
        const { data, error } = await supabase
            .from('calls')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching calls:', error);
            return [];
        }
        return data.map(this.mapCallFromDb);
    }
    async getCallStats(userId) {
        const calls = await this.getCalls(userId);
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const todayCalls = calls.filter(c => new Date(c.createdAt) >= todayStart);
        const yesterdayCalls = calls.filter(c => {
            const date = new Date(c.createdAt);
            return date >= yesterdayStart && date < todayStart;
        });
        return {
            total: calls.length,
            missed: calls.filter(c => c.status === 'missed').length,
            answered: calls.filter(c => c.status === 'answered').length,
            averageDuration: calls.reduce((acc, c) => acc + (c.duration || 0), 0) / calls.length || 0,
            todayCallsCount: todayCalls.length,
            yesterdayCallsCount: yesterdayCalls.length,
        };
    }
    async createCall(callData) {
        const { data, error } = await supabase
            .from('calls')
            .insert([{
                user_id: callData.userId,
                phone_number_id: callData.phoneNumberId,
                caller_number: callData.callerNumber,
                status: callData.status,
                duration: callData.duration,
                routed_to_location: callData.routedToLocation,
                call_type: callData.callType,
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create call: ${error.message}`);
        }
        return this.mapCallFromDb(data);
    }
    // ==================
    // MESSAGE OPERATIONS
    // ==================
    async getMessages(userId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data.map(this.mapMessageFromDb);
    }
    async getMessageById(messageId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
        if (error) {
            console.error('Error fetching message by id:', error);
            return null;
        }
        return data ? this.mapMessageFromDb(data) : null;
    }
    async createMessage(messageData) {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                user_id: messageData.userId,
                phone_number_id: messageData.phoneNumberId,
                type: messageData.type,
                content: messageData.content,
                recipient: messageData.recipient,
                status: messageData.status || 'pending',
                direction: messageData.direction || 'outbound',
                whatsapp_message_id: messageData.whatsappMessageId,
                template_id: messageData.templateId,
                error_message: messageData.errorMessage,
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create message: ${error.message}`);
        }
        return this.mapMessageFromDb(data);
    }
    async getMessageStats(userId) {
        const messages = await this.getMessages(userId);
        return {
            total: messages.length,
            sent: messages.filter(m => m.status === 'sent').length,
            delivered: messages.filter(m => m.status === 'delivered').length,
            received: messages.filter(m => m.status === 'received').length,
            read: messages.filter(m => m.status === 'read').length,
            failed: messages.filter(m => m.status === 'failed').length,
            pending: messages.filter(m => m.status === 'pending').length,
            inbound: messages.filter(m => m.direction === 'inbound').length,
            outbound: messages.filter(m => m.direction === 'outbound').length,
            revenue: 0,
        };
    }
    async getConversationHistory(userId, recipient, limit = 50) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .eq('recipient', recipient)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            console.error('Error fetching conversation history:', error);
            return [];
        }
        return data.map(this.mapMessageFromDb);
    }
    async getMessageByWhatsAppId(whatsappMessageId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('whatsapp_message_id', whatsappMessageId)
            .single();
        if (error) {
            console.error('Error fetching message by whatsapp_id:', error);
            return null;
        }
        return data ? this.mapMessageFromDb(data) : null;
    }
    async updateMessageError(whatsappMessageId, errorMessage) {
        const { error } = await supabase
            .from('messages')
            .update({
            status: 'failed',
            error_message: errorMessage
        })
            .eq('whatsapp_message_id', whatsappMessageId);
        if (error) {
            console.error('Error updating message error:', error);
            throw new Error(`Failed to update message error: ${error.message}`);
        }
    }
    async updateMessageStatus(whatsappMessageId, status) {
        const { error } = await supabase
            .from('messages')
            .update({ status })
            .eq('whatsapp_message_id', whatsappMessageId);
        if (error) {
            console.error('Error updating message status:', error);
            throw new Error(`Failed to update message status: ${error.message}`);
        }
    }
    // ==================
    // PHONE NUMBER OPERATIONS
    // ==================
    async getPhoneNumbers(userId) {
        const { data, error } = await supabase
            .from('phone_numbers')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            console.error('Error fetching phone numbers:', error);
            return [];
        }
        return data.map(this.mapPhoneNumberFromDb);
    }
    async getPhoneNumberById(phoneNumberId) {
        const { data, error } = await supabase
            .from('phone_numbers')
            .select('*')
            .eq('id', phoneNumberId)
            .single();
        if (error) {
            console.error('Error fetching phone number by id:', error);
            return null;
        }
        return data ? this.mapPhoneNumberFromDb(data) : null;
    }
    async getPhoneNumberByProviderId(providerId) {
        const { data, error } = await supabase
            .from('phone_numbers')
            .select('*')
            .eq('provider_id', providerId)
            .single();
        if (error) {
            console.error('Error fetching phone number by provider_id:', error);
            return null;
        }
        return data ? this.mapPhoneNumberFromDb(data) : null;
    }
    async createPhoneNumber(phoneData) {
        const { data, error } = await supabase
            .from('phone_numbers')
            .insert([{
                user_id: phoneData.userId,
                location_id: phoneData.locationId,
                phone_number: phoneData.number,
                type: phoneData.type,
                linked_number: phoneData.linkedNumber,
                channel: phoneData.channel,
                active: phoneData.active !== undefined ? phoneData.active : true,
                forwarding_enabled: phoneData.forwardingEnabled !== undefined ? phoneData.forwardingEnabled : true,
                provider_id: phoneData.providerId,
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create phone number: ${error.message}`);
        }
        return this.mapPhoneNumberFromDb(data);
    }
    async updatePhoneNumber(id, data) {
        const { data: updated, error } = await supabase
            .from('phone_numbers')
            .update({
            phone_number: data.number,
            type: data.type,
            linked_number: data.linkedNumber,
            active: data.active,
            forwarding_enabled: data.forwardingEnabled,
            channel: data.channel,
            provider_id: data.providerId,
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to update phone number: ${error.message}`);
        return this.mapPhoneNumberFromDb(updated);
    }
    // ==================
    // ROUTING RULE OPERATIONS
    // ==================
    async getRoutingRules(userId) {
        const { data, error } = await supabase
            .from('routing_rules')
            .select('*')
            .eq('user_id', userId)
            .order('priority', { ascending: true });
        if (error) {
            console.error('Error fetching routing rules:', error);
            return [];
        }
        return data.map(this.mapRoutingRuleFromDb);
    }
    async createRoutingRule(ruleData) {
        const { data, error } = await supabase
            .from('routing_rules')
            .insert([{
                user_id: ruleData.userId,
                location_id: ruleData.locationId,
                priority: ruleData.priority,
                conditions: ruleData.conditions,
                forwarding_number: ruleData.forwardingNumber,
                ivr_options: ruleData.ivrOptions,
            }])
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create routing rule: ${error.message}`);
        }
        return this.mapRoutingRuleFromDb(data);
    }
    // ==================
    // MAPPER FUNCTIONS (DB -> Domain)
    // ==================
    mapUserFromDb(dbUser) {
        return {
            id: dbUser.id,
            auth_id: dbUser.auth_id,
            username: dbUser.username,
            email: dbUser.email,
            companyName: dbUser.company_name,
            termsAccepted: dbUser.terms_accepted,
            termsAcceptedAt: dbUser.terms_accepted_at ? new Date(dbUser.terms_accepted_at) : undefined,
            planType: dbUser.plan_type, // ✅ AGREGADO
            subscriptionStatus: dbUser.subscription_status,
        };
    }
    mapLocationFromDb(dbLocation) {
        return {
            id: dbLocation.id,
            userId: dbLocation.user_id,
            groupId: dbLocation.group_id,
            name: dbLocation.name,
            address: dbLocation.address,
            timezone: dbLocation.timezone,
            businessHours: dbLocation.business_hours,
            trialStartDate: dbLocation.trial_start_date ? new Date(dbLocation.trial_start_date) : undefined,
            isFirstLocation: dbLocation.is_first_location,
        };
    }
    mapTemplateFromDb(dbTemplate) {
        return {
            id: dbTemplate.id,
            userId: dbTemplate.user_id,
            locationId: dbTemplate.location_id,
            groupId: dbTemplate.group_id,
            name: dbTemplate.name,
            content: dbTemplate.content,
            type: dbTemplate.type,
            channel: dbTemplate.channel,
            variables: dbTemplate.variables,
        };
    }
    mapCallFromDb(dbCall) {
        return {
            id: dbCall.id,
            userId: dbCall.user_id,
            phoneNumberId: dbCall.phone_number_id,
            callerNumber: dbCall.caller_number,
            status: dbCall.status,
            duration: dbCall.duration,
            createdAt: new Date(dbCall.created_at),
            routedToLocation: dbCall.routed_to_location,
            callType: dbCall.call_type,
        };
    }
    mapMessageFromDb(dbMessage) {
        return {
            id: dbMessage.id,
            userId: dbMessage.user_id,
            phoneNumberId: dbMessage.phone_number_id,
            type: dbMessage.type,
            content: dbMessage.content,
            recipient: dbMessage.recipient,
            status: dbMessage.status,
            createdAt: new Date(dbMessage.created_at),
            direction: dbMessage.direction,
            whatsappMessageId: dbMessage.whatsapp_message_id,
            templateId: dbMessage.template_id,
            errorMessage: dbMessage.error_message,
        };
    }
    mapPhoneNumberFromDb(dbPhone) {
        return {
            id: dbPhone.id,
            userId: dbPhone.user_id,
            locationId: dbPhone.location_id,
            number: dbPhone.phone_number,
            type: dbPhone.type,
            linkedNumber: dbPhone.linked_number,
            channel: dbPhone.channel,
            active: dbPhone.active,
            forwardingEnabled: dbPhone.forwarding_enabled,
            providerId: dbPhone.provider_id,
        };
    }
    mapRoutingRuleFromDb(dbRule) {
        return {
            id: dbRule.id,
            userId: dbRule.user_id,
            locationId: dbRule.location_id,
            priority: dbRule.priority,
            conditions: dbRule.conditions,
            forwardingNumber: dbRule.forwarding_number,
            ivrOptions: dbRule.ivr_options,
        };
    }
    getClient() {
        return supabase; // mantiene la instancia que ya estás usando en todos los métodos
    }
}
export const supabaseService = new SupabaseService();
