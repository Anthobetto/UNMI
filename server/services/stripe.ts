import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Payment functionality will be limited.');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2025-01-27.acacia',
});

export async function createLocationPaymentIntent(userId: number) {
  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    return await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      metadata: {
        userId,
        type: 'location_creation'
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function createPaymentSession(userId: number) {
  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Location Registration',
              description: 'Register a new location with phone number',
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'http://localhost:5000'}/locations?success=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/locations?canceled=true`,
      metadata: {
        userId,
        type: 'location_registration'
      }
    });

    if (!session.url) {
      throw new Error('Failed to generate checkout session URL');
    }

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle successful payment
        // The actual location creation is handled in the routes
        console.log('Payment successful for session:', session.id);
        break;

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
}