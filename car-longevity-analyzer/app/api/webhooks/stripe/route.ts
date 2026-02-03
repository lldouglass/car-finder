import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import { upgradeUserToPremium, downgradeUserToFree } from '@/lib/usage';
import { prisma } from '@/lib/db';
import { STRIPE_SUBSCRIPTION_STATUS } from '@/lib/constants';

/**
 * Helper to extract customer ID from Stripe customer field.
 * Handles string, Customer object, DeletedCustomer object, or null.
 */
function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  return customer.id;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Idempotency check: skip if we've already processed this event
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existingEvent) {
      return NextResponse.json({ received: true });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const clerkId = session.metadata?.clerkId;
        const customerId = getCustomerId(session.customer);

        if (clerkId && customerId) {
          await upgradeUserToPremium(clerkId, customerId);
        } else {
          console.error('Checkout completed but missing clerkId or customerId', {
            hasClerkId: !!clerkId,
            hasCustomerId: !!customerId,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = getCustomerId(subscription.customer);

        if (customerId) {
          await downgradeUserToFree(customerId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = getCustomerId(subscription.customer);

        // If subscription is cancelled or unpaid, downgrade user
        if (
          customerId &&
          (subscription.status === STRIPE_SUBSCRIPTION_STATUS.CANCELED ||
            subscription.status === STRIPE_SUBSCRIPTION_STATUS.UNPAID)
        ) {
          await downgradeUserToFree(customerId);
        }
        break;
      }
    }

    // Record that we've processed this event (idempotency)
    await prisma.stripeEvent.create({
      data: { eventId: event.id, type: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
