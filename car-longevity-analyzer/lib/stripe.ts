import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Trim whitespace/newlines that may have been accidentally copied
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim();

export const stripe = new Stripe(stripeSecretKey);

/**
 * Get the application URL for Stripe redirects.
 * Handles missing env var, trimming, and protocol normalization.
 */
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('NEXT_PUBLIC_APP_URL not set in production - using fallback');
    }
    return 'http://localhost:3000';
  }

  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

/**
 * Create a Stripe Checkout session for Premium subscription.
 */
export async function createCheckoutSession(clerkId: string, email: string) {
  const priceId = process.env.PREMIUM_PRICE_ID?.trim();

  if (!priceId) {
    throw new Error('Missing PREMIUM_PRICE_ID environment variable');
  }

  const appUrl = getAppUrl();

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
  const appUrl = getAppUrl();

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
