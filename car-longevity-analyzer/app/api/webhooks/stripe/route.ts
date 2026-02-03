import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { upgradeUserToPremium, downgradeUserToFree, updateUserEmail } from '@/lib/usage';
import type Stripe from 'stripe';

/**
 * Extract customer ID from Stripe customer field (can be string, object, or null)
 */
function extractCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  if (typeof customer === 'object' && 'id' in customer) return customer.id;
  return null;
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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const customerId = extractCustomerId(session.customer);
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log(`Webhook checkout.session.completed: clerkId=${clerkId}, customerId=${customerId}, email=${customerEmail}`);

        if (clerkId && customerId) {
          console.log(`Upgrading user ${clerkId} to Premium with customer ${customerId}`);
          await upgradeUserToPremium(clerkId, customerId);

          // Also update email if we have it
          if (customerEmail) {
            await updateUserEmail(clerkId, customerEmail);
          }
        } else {
          console.error('Checkout completed but missing clerkId or customerId', {
            clerkId,
            customerId,
            sessionId: session.id,
            metadata: session.metadata,
            customer: session.customer,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);

        if (customerId) {
          console.log(`Downgrading customer ${customerId} to Free (subscription deleted)`);
          await downgradeUserToFree(customerId);
        } else {
          console.error('Subscription deleted but no customerId found', {
            subscriptionId: subscription.id,
            customer: subscription.customer,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);

        // If subscription is cancelled or unpaid, downgrade user
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          if (customerId) {
            console.log(`Subscription ${subscription.id} status: ${subscription.status}, downgrading customer ${customerId}`);
            await downgradeUserToFree(customerId);
          } else {
            console.error('Subscription updated but no customerId found', {
              subscriptionId: subscription.id,
              status: subscription.status,
              customer: subscription.customer,
            });
          }
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
