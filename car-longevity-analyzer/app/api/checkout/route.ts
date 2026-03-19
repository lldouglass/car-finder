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

    // Handle Stripe/config-specific errors
    if (
      error instanceof Error &&
      (
        error.message.includes('BUYER_PASS_PRICE_ID') ||
        error.message.includes('one-time Stripe price') ||
        error.message.includes('active Stripe price')
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Buyer Pass price is misconfigured' },
        { status: 503 }
      );
    }

    // Return generic error to client (actual error already logged above)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
