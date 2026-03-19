import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim();

export const stripe = new Stripe(stripeSecretKey);

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('NEXT_PUBLIC_APP_URL not set in production - using fallback');
    }
    return 'http://localhost:3000';
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

function getBuyerPassPriceId(): string {
  const priceId =
    process.env.BUYER_PASS_PRICE_ID?.trim() ||
    process.env.PREMIUM_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_ID?.trim();

  if (!priceId) {
    throw new Error('Missing BUYER_PASS_PRICE_ID environment variable');
  }

  return priceId;
}

/**
 * Create a Stripe Checkout session for the one-time Buyer Pass.
 */
export async function createCheckoutSession(clerkId: string, email: string) {
  const priceId = getBuyerPassPriceId();
  const appUrl = getAppUrl();
  const price = await stripe.prices.retrieve(priceId);

  if (!price.active) {
    throw new Error('BUYER_PASS_PRICE_ID must reference an active Stripe price');
  }

  if (price.type !== 'one_time' || price.recurring) {
    throw new Error('BUYER_PASS_PRICE_ID must reference a one-time Stripe price');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_creation: 'always',
    customer_email: email,
    metadata: {
      clerkId,
      purchaseType: 'buyer_pass',
      buyerPassPriceId: price.id,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/?buyerPass=success`,
    cancel_url: `${appUrl}/?buyerPass=cancelled`,
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
