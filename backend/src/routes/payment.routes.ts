import { Router } from 'express';
import { stripeService } from '../services/StripeService';
import { supabase } from '../config/database'; 
import { supabaseService } from '../services/SupabaseService';

const router = Router();

router.post('/create-checkout', async (req, res) => {
  try {
    const { userId, email, planType, locations, departments } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ message: 'User ID and Email are required' });
    }

    const selections = [{
      planType: planType,        
      quantity: locations || 1,  
      departments: departments || 1
    }];

    console.log(`🔍 Buscando usuario en BD para Checkout/Upgrade: ${userId}`);

    const { data: userRecord, error: fetchError } = await supabase
      .from('users')
      .select('id, stripe_customer_id, subscription_status')
      .or(`auth_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (fetchError) {
      console.error("Error buscando usuario:", fetchError);
    }

    if (userRecord?.stripe_customer_id && userRecord?.subscription_status === 'active') {
      console.log(`⚡ Modo Upgrade Silencioso Activado para ${email}`);
      
      const stripeItems = stripeService.mapSelectionsToStripeItems(selections); 
      await stripeService.upgradeExistingSubscription(userRecord.stripe_customer_id, stripeItems);
      
      await supabase
        .from('users')
        .update({ plan_type: planType })
        .eq('id', userRecord.id);

      await supabase
        .from('purchased_locations')
        .delete()
        .eq('user_id', userRecord.id);

      for (const sel of selections) {
         await supabase
           .from('purchased_locations')
           .insert({
             user_id: userRecord.id,
             plan_type: sel.planType,
             quantity: sel.quantity,
             departments_count: sel.departments || 1,
             status: 'active'
           });
      }
      
      return res.json({ success: true, message: 'Suscripción actualizada correctamente' });
    }

    console.log(`💳 Modo Checkout Normal Activado para ${email}`);
    const session = await stripeService.createCheckoutSessionCustom({
      email,
      userId: userRecord?.id || userId, 
      selections,
      metadata: { source: 'plan_upgrade_page' },
      successUrl: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancelUrl: `${process.env.FRONTEND_URL}/plan?canceled=true`
    });

    res.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Error gestionando el pago/upgrade:', error);
    res.status(500).json({ message: error.message || 'Error processsing request' });
  }
});

export default router;