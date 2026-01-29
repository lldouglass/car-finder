import { prisma } from './db';

const FREE_LIMIT = parseInt(process.env.FREE_ANALYSES_PER_MONTH || '2');

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
  used: number;
  limit: number;
}

/**
 * Check if user can perform an analysis and increment usage if allowed.
 * Creates user record if not exists.
 */
export async function checkAndIncrementUsage(clerkId: string): Promise<UsageCheckResult> {
  const month = new Date().toISOString().slice(0, 7); // "2026-01"

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    // User will be created with email from Clerk webhook
    // For now, create with placeholder email
    user = await prisma.user.create({
      data: {
        clerkId,
        email: `${clerkId}@placeholder.temp`,
      },
    });
  }

  if (user.plan === 'PREMIUM') {
    return { allowed: true, remaining: Infinity, isPremium: true, used: 0, limit: Infinity };
  }

  // Get or create usage record
  let usage = await prisma.usageRecord.findUnique({
    where: { userId_month: { userId: user.id, month } },
  });

  if (!usage) {
    usage = await prisma.usageRecord.create({
      data: { userId: user.id, month, analysisCount: 0 },
    });
  }

  if (usage.analysisCount >= FREE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      isPremium: false,
      used: usage.analysisCount,
      limit: FREE_LIMIT,
    };
  }

  // Increment usage
  const updatedUsage = await prisma.usageRecord.update({
    where: { id: usage.id },
    data: { analysisCount: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: FREE_LIMIT - updatedUsage.analysisCount,
    isPremium: false,
    used: updatedUsage.analysisCount,
    limit: FREE_LIMIT,
  };
}

/**
 * Get current usage status for a user without incrementing.
 */
export async function getUsageStatus(clerkId: string): Promise<{
  used: number;
  limit: number;
  isPremium: boolean;
  remaining: number;
}> {
  const month = new Date().toISOString().slice(0, 7);

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { usageRecords: { where: { month } } },
  });

  if (!user) {
    return { used: 0, limit: FREE_LIMIT, isPremium: false, remaining: FREE_LIMIT };
  }

  if (user.plan === 'PREMIUM') {
    return { used: 0, limit: Infinity, isPremium: true, remaining: Infinity };
  }

  const used = user.usageRecords[0]?.analysisCount || 0;
  return {
    used,
    limit: FREE_LIMIT,
    isPremium: false,
    remaining: Math.max(0, FREE_LIMIT - used),
  };
}

/**
 * Upgrade a user to premium plan.
 */
export async function upgradeUserToPremium(clerkId: string, stripeCustomerId: string): Promise<void> {
  await prisma.user.upsert({
    where: { clerkId },
    update: {
      plan: 'PREMIUM',
      stripeCustomerId,
    },
    create: {
      clerkId,
      email: `${clerkId}@placeholder.temp`,
      plan: 'PREMIUM',
      stripeCustomerId,
    },
  });
}

/**
 * Downgrade a user to free plan (on subscription cancellation).
 */
export async function downgradeUserToFree(stripeCustomerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: { plan: 'FREE' },
  });
}

/**
 * Update user email from Clerk webhook.
 */
export async function updateUserEmail(clerkId: string, email: string): Promise<void> {
  await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });
}
