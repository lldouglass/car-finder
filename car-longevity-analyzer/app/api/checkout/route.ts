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

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes('PREMIUM_PRICE_ID')) {
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
