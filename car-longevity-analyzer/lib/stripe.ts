import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout session for Premium subscription.
 */
export async function createCheckoutSession(clerkId: string, email: string) {
  const priceId = process.env.PREMIUM_PRICE_ID;

  if (!priceId) {
    throw new Error('Missing PREMIUM_PRICE_ID environment variable');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    metadata: { clerkId },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/?upgraded=true`,
    cancel_url: `${appUrl}/?cancelled=true`,
  });

  return session;
}

/**
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function createCustomerPortal(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/`,
  });

  return session;
}

/**
 * Verify Stripe webhook signature.
 */
export function constructWebhookEvent(body: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
