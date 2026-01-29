import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createCustomerPortal } from '@/lib/stripe';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { stripeCustomerId: true, plan: true },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const session = await createCustomerPortal(user.stripeCustomerId);

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Billing Portal Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
