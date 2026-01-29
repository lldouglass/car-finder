import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { upgradeUserToPremium, downgradeUserToFree } from '@/lib/usage';

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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const clerkId = session.metadata?.clerkId;
        const customerId = session.customer as string;

        if (clerkId && customerId) {
          console.log(`Upgrading user ${clerkId} to Premium`);
          await upgradeUserToPremium(clerkId, customerId);
        } else {
          console.warn('Checkout completed but missing clerkId or customerId', session);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        if (customerId) {
          console.log(`Downgrading customer ${customerId} to Free`);
          await downgradeUserToFree(customerId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // If subscription is cancelled or unpaid, downgrade user
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          console.log(`Subscription ${subscription.id} status: ${subscription.status}, downgrading`);
          await downgradeUserToFree(customerId);
        }
        break;
      }

      default:
        // Unhandled event type - log but don't error
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
