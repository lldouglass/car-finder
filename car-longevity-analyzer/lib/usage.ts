import { prisma } from './db';
import { clerkClient } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

// Validate FREE_LIMIT on module load to fail fast if misconfigured
const FREE_LIMIT_RAW = parseInt(process.env.FREE_ANALYSES_PER_MONTH || '2');
if (isNaN(FREE_LIMIT_RAW) || FREE_LIMIT_RAW < 1) {
  throw new Error(`Invalid FREE_ANALYSES_PER_MONTH: ${process.env.FREE_ANALYSES_PER_MONTH}`);
}
const FREE_LIMIT = FREE_LIMIT_RAW;

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
 * Uses atomic operations to prevent race conditions.
 */
export async function checkAndIncrementUsage(clerkId: string): Promise<UsageCheckResult> {
  const month = new Date().toISOString().slice(0, 7); // "2026-01"

  // Get or create user (with race condition handling)
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    // Fetch email from Clerk API
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error('User has no email address');
    }

    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
        },
      });
    } catch (error) {
      // Handle race condition - another request may have created the user
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) {
          throw new Error('User creation race condition unresolved');
        }
      } else {
        throw error;
      }
    }
  }

  if (user.plan === 'PREMIUM') {
    return { allowed: true, remaining: Infinity, isPremium: true, used: 0, limit: Infinity };
  }

  // Use atomic conditional update to prevent race conditions (TOCTOU fix)
  // This atomically increments only if the count is below the limit
  const result = await prisma.usageRecord.updateMany({
    where: {
      userId: user.id,
      month,
      analysisCount: { lt: FREE_LIMIT },
    },
    data: { analysisCount: { increment: 1 } },
  });

  if (result.count === 0) {
    // Either record doesn't exist or limit is already reached
    const existing = await prisma.usageRecord.findUnique({
      where: { userId_month: { userId: user.id, month } },
    });

    if (existing && existing.analysisCount >= FREE_LIMIT) {
      // Limit reached
      return {
        allowed: false,
        remaining: 0,
        isPremium: false,
        used: existing.analysisCount,
        limit: FREE_LIMIT,
      };
    }

    // Record doesn't exist - create it with count 1 (use upsert for race safety)
    const newUsage = await prisma.usageRecord.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: { analysisCount: { increment: 1 } },
      create: { userId: user.id, month, analysisCount: 1 },
    });

    return {
      allowed: true,
      remaining: FREE_LIMIT - newUsage.analysisCount,
      isPremium: false,
      used: newUsage.analysisCount,
      limit: FREE_LIMIT,
    };
  }

  // Successfully incremented - fetch updated count
  const updatedUsage = await prisma.usageRecord.findUnique({
    where: { userId_month: { userId: user.id, month } },
  });

  return {
    allowed: true,
    remaining: FREE_LIMIT - (updatedUsage?.analysisCount || 1),
    isPremium: false,
    used: updatedUsage?.analysisCount || 1,
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
 * Uses upsert to handle race conditions between webhook and user signup.
 */
export async function upgradeUserToPremium(clerkId: string, stripeCustomerId: string): Promise<void> {
  // Fetch email from Clerk (needed for create case in upsert)
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error('User has no email address');
  }

  await prisma.user.upsert({
    where: { clerkId },
    update: { plan: 'PREMIUM', stripeCustomerId },
    create: { clerkId, email, plan: 'PREMIUM', stripeCustomerId },
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
