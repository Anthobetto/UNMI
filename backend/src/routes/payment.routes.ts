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

    console.log(`💳 Creando sesión de pago para: ${email} (${planType})`);


    const selections = [{
      planType: planType,        
      quantity: locations || 1,  
      departments: departments || 1
    }];

    const session = await stripeService.createCheckoutSessionCustom({
      email,
      userId,
      selections,
      metadata: {
        source: 'plan_upgrade_page' 
      },
      successUrl: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancelUrl: `${process.env.FRONTEND_URL}/plan?canceled=true`
    });

    res.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Error creando sesión de pago:', error);
    res.status(500).json({ message: error.message || 'Error initiating checkout' });
  }
});

export default router;