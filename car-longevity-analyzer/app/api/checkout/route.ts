import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email address found' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession(userId, email);

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout Error:', error);

    // Log key prefix for debugging (safe - only shows sk_test_ or sk_live_)
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 8) || 'NOT_SET';
    console.error('Stripe key prefix:', keyPrefix);

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes('PREMIUM_PRICE_ID')) {
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Return actual error message for debugging with key type hint
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const keyType = keyPrefix.startsWith('sk_live') ? 'live' : keyPrefix.startsWith('sk_test') ? 'test' : 'invalid';
    return NextResponse.json(
      { success: false, error: `Checkout failed (${keyType} key): ${errorMessage}` },
      { status: 500 }
    );
  }
}
