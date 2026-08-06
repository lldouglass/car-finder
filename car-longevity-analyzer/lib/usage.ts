import { prisma } from './db';
import { clerkClient } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

const FREE_LIMIT_RAW = parseInt(process.env.FREE_ANALYSES_PER_MONTH || '3');
if (isNaN(FREE_LIMIT_RAW) || FREE_LIMIT_RAW < 1) {
  throw new Error(`Invalid FREE_ANALYSES_PER_MONTH: ${process.env.FREE_ANALYSES_PER_MONTH}`);
}
const FREE_LIMIT = FREE_LIMIT_RAW;
const BUYER_PASS_DURATION_DAYS = 30;
const BUYER_PASS_DURATION_MS = BUYER_PASS_DURATION_DAYS * 24 * 60 * 60 * 1000;
const STRIPE_GUEST_ID_PREFIX = 'stripe_guest:';

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
  isBuyerPassActive: boolean;
  buyerPassExpiresAt: Date | null;
  used: number;
  limit: number;
}

function hasActiveBuyerPass(user: { buyerPassExpiresAt: Date | null | undefined }) {
  return !!user.buyerPassExpiresAt && user.buyerPassExpiresAt.getTime() > Date.now();
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getBuyerPassExpiry(baseDate?: Date | null) {
  const startAt = baseDate && baseDate.getTime() > Date.now() ? baseDate : new Date();
  return new Date(startAt.getTime() + BUYER_PASS_DURATION_MS);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isStripeGuestId(clerkId: string) {
  return clerkId.startsWith(STRIPE_GUEST_ID_PREFIX);
}

async function getUserEmail(clerkId: string, fallbackEmail?: string | null) {
  if (fallbackEmail) {
    return normalizeEmail(fallbackEmail);
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error('User has no email address');
  }

  return normalizeEmail(email);
}

async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: {
        equals: normalizeEmail(email),
        mode: 'insensitive',
      },
    },
  });
}

/**
 * Resolve a Clerk identity to the existing database user. A Buyer Pass bought
 * before signup is stored under a Stripe guest ID and adopted when a verified
 * Clerk account with the same email first uses the app.
 */
async function ensureUserRecord(clerkId: string) {
  const userByClerkId = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (userByClerkId) {
    return userByClerkId;
  }

  const email = await getUserEmail(clerkId);
  const userByEmail = await findUserByEmail(email);

  if (userByEmail) {
    return prisma.user.update({
      where: { id: userByEmail.id },
      data: { clerkId, email },
    });
  }

  try {
    return await prisma.user.create({
      data: { clerkId, email },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }

    const racedUser =
      await prisma.user.findUnique({ where: { clerkId } }) ??
      await findUserByEmail(email);

    if (!racedUser) {
      throw new Error('User creation race condition unresolved');
    }

    if (racedUser.clerkId === clerkId) {
      return racedUser;
    }

    return prisma.user.update({
      where: { id: racedUser.id },
      data: { clerkId, email },
    });
  }
}

/**
 * Check if user can perform an analysis and increment usage if allowed.
 * Creates user record if not exists.
 * Uses atomic operations to prevent race conditions.
 */
export async function checkAndIncrementUsage(clerkId: string): Promise<UsageCheckResult> {
  const month = getMonthKey();
  const user = await ensureUserRecord(clerkId);

  if (hasActiveBuyerPass(user)) {
    return {
      allowed: true,
      remaining: FREE_LIMIT,
      isPremium: true,
      isBuyerPassActive: true,
      buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
      used: 0,
      limit: FREE_LIMIT,
    };
  }

  const result = await prisma.usageRecord.updateMany({
    where: {
      userId: user.id,
      month,
      analysisCount: { lt: FREE_LIMIT },
    },
    data: { analysisCount: { increment: 1 } },
  });

  if (result.count === 0) {
    const existing = await prisma.usageRecord.findUnique({
      where: { userId_month: { userId: user.id, month } },
    });

    if (existing && existing.analysisCount >= FREE_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        isPremium: false,
        isBuyerPassActive: false,
        buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
        used: existing.analysisCount,
        limit: FREE_LIMIT,
      };
    }

    const newUsage = await prisma.usageRecord.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: { analysisCount: { increment: 1 } },
      create: { userId: user.id, month, analysisCount: 1 },
    });

    return {
      allowed: true,
      remaining: FREE_LIMIT - newUsage.analysisCount,
      isPremium: false,
      isBuyerPassActive: false,
      buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
      used: newUsage.analysisCount,
      limit: FREE_LIMIT,
    };
  }

  const updatedUsage = await prisma.usageRecord.findUnique({
    where: { userId_month: { userId: user.id, month } },
  });

  return {
    allowed: true,
    remaining: FREE_LIMIT - (updatedUsage?.analysisCount || 1),
    isPremium: false,
    isBuyerPassActive: false,
    buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
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
  isBuyerPassActive: boolean;
  buyerPassExpiresAt: Date | null;
  remaining: number;
}> {
  const month = getMonthKey();

  await ensureUserRecord(clerkId);
  const user = await prisma.user.findUniqueOrThrow({
    where: { clerkId },
    include: { usageRecords: { where: { month } } },
  });

  if (hasActiveBuyerPass(user)) {
    return {
      used: 0,
      limit: FREE_LIMIT,
      isPremium: true,
      isBuyerPassActive: true,
      buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
      remaining: FREE_LIMIT,
    };
  }

  const used = user.usageRecords[0]?.analysisCount || 0;
  return {
    used,
    limit: FREE_LIMIT,
    isPremium: false,
    isBuyerPassActive: false,
    buyerPassExpiresAt: user.buyerPassExpiresAt ?? null,
    remaining: Math.max(0, FREE_LIMIT - used),
  };
}

/**
 * Grant or extend Buyer Pass access for 30 days.
 */
export async function grantBuyerPassAccess(
  clerkId: string,
  stripeCustomerId?: string | null,
  fallbackEmail?: string | null
): Promise<void> {
  const email = await getUserEmail(clerkId, fallbackEmail);
  const userByClerkId = await prisma.user.findUnique({
    where: { clerkId },
  });
  const existingUser = userByClerkId ?? await findUserByEmail(email);

  const buyerPassExpiresAt = getBuyerPassExpiry(existingUser?.buyerPassExpiresAt);

  if (existingUser) {
    const shouldAdoptClerkId =
      isStripeGuestId(existingUser.clerkId) && !isStripeGuestId(clerkId);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(shouldAdoptClerkId ? { clerkId } : {}),
        email,
        plan: 'PREMIUM',
        buyerPassExpiresAt,
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      },
    });
    return;
  }

  try {
    await prisma.user.create({
      data: {
        clerkId,
        email,
        plan: 'PREMIUM',
        stripeCustomerId: stripeCustomerId ?? undefined,
        buyerPassExpiresAt,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }

    const racedUser =
      await prisma.user.findUnique({ where: { clerkId } }) ??
      await findUserByEmail(email);

    if (!racedUser) {
      throw new Error('Buyer Pass grant race condition unresolved');
    }

    await prisma.user.update({
      where: { id: racedUser.id },
      data: {
        ...(
          isStripeGuestId(racedUser.clerkId) && !isStripeGuestId(clerkId)
            ? { clerkId }
            : {}
        ),
        email,
        plan: 'PREMIUM',
        buyerPassExpiresAt: getBuyerPassExpiry(racedUser.buyerPassExpiresAt),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      },
    });
  }
}

/**
 * Persist a guest purchase by Stripe checkout email until the buyer creates or
 * signs into a Clerk account with that same verified email.
 */
export async function grantBuyerPassAccessForEmail(
  email: string,
  stripeCustomerId: string | null,
  checkoutSessionId: string
): Promise<void> {
  const guestId = `${STRIPE_GUEST_ID_PREFIX}${stripeCustomerId ?? checkoutSessionId}`;
  await grantBuyerPassAccess(guestId, stripeCustomerId, email);
}

/**
 * Clear paid access for a customer. Kept for future refund/support handling.
 */
export async function downgradeUserToFree(stripeCustomerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: { plan: 'FREE', buyerPassExpiresAt: null },
  });
}

/**
 * Update user email from Clerk or Stripe webhook context.
 */
export async function updateUserEmail(clerkId: string, email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const existingUser =
    await prisma.user.findUnique({ where: { clerkId } }) ??
    await findUserByEmail(normalizedEmail);

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(
          isStripeGuestId(existingUser.clerkId) && !isStripeGuestId(clerkId)
            ? { clerkId }
            : {}
        ),
        email: normalizedEmail,
      },
    });
    return;
  }

  await prisma.user.create({
    data: { clerkId, email: normalizedEmail },
  });
}
