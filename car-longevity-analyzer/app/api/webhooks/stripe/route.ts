import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import {
  grantBuyerPassAccess,
  grantBuyerPassAccessForEmail,
} from '@/lib/usage';
import { prisma } from '@/lib/db';

/**
 * Helper to extract customer ID from Stripe customer field.
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
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purchaseType !== 'buyer_pass') {
          break;
        }

        const clerkId = session.metadata?.clerkId;
        const customerId = getCustomerId(session.customer);
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (clerkId) {
          await grantBuyerPassAccess(clerkId, customerId, customerEmail);
        } else if (customerEmail) {
          await grantBuyerPassAccessForEmail(
            customerEmail,
            customerId,
            session.id
          );
        } else {
          throw new Error(
            `Guest checkout ${session.id} completed without a customer email`
          );
        }
        break;
      }

      default:
        break;
    }

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
