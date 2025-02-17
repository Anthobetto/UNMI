import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2025-01-27.acacia',
});

export async function createLocationPaymentIntent(userId: number) {
  try {
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
    return await stripe.checkout.sessions.create({
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
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}