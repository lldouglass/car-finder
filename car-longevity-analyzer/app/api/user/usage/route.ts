import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUsageStatus } from '@/lib/usage';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const usage = await getUsageStatus(userId);

    return NextResponse.json({
      success: true,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        isPremium: usage.isPremium,
      },
    });
  } catch (error) {
    console.error('Usage API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
