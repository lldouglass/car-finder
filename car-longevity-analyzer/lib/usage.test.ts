import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetClerkUser } = vi.hoisted(() => ({
  mockGetClerkUser: vi.fn(),
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    usageRecord: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('./db', () => ({ prisma: mockPrisma }));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(async () => ({
    users: { getUser: mockGetClerkUser },
  })),
}));

import {
  getUsageStatus,
  grantBuyerPassAccessForEmail,
} from './usage';

function userFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'db_user_1',
    clerkId: 'user_existing',
    email: 'buyer@example.com',
    plan: 'FREE',
    stripeCustomerId: null,
    buyerPassExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('guest Buyer Pass handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores a guest purchase under a stable Stripe identity and normalized email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(userFixture());

    await grantBuyerPassAccessForEmail(
      ' Buyer@Example.COM ',
      'cus_guest_123',
      'cs_test_123'
    );

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkId: 'stripe_guest:cus_guest_123',
        email: 'buyer@example.com',
        plan: 'PREMIUM',
        stripeCustomerId: 'cus_guest_123',
        buyerPassExpiresAt: expect.any(Date),
      }),
    });
  });

  it('grants a guest checkout directly to an existing account with the same email', async () => {
    const existingUser = userFixture();
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(existingUser);
    mockPrisma.user.update.mockResolvedValue(existingUser);

    await grantBuyerPassAccessForEmail(
      'buyer@example.com',
      'cus_guest_456',
      'cs_test_456'
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      data: expect.objectContaining({
        email: 'buyer@example.com',
        plan: 'PREMIUM',
        stripeCustomerId: 'cus_guest_456',
      }),
    });
    expect(mockPrisma.user.update.mock.calls[0][0].data).not.toHaveProperty('clerkId');
  });

  it('adopts a paid guest record when the matching Clerk account signs in', async () => {
    const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const guestUser = userFixture({
      clerkId: 'stripe_guest:cus_guest_789',
      plan: 'PREMIUM',
      buyerPassExpiresAt: expiresAt,
    });
    const adoptedUser = { ...guestUser, clerkId: 'user_new_789' };

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockGetClerkUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: 'Buyer@Example.com' }],
    });
    mockPrisma.user.findFirst.mockResolvedValue(guestUser);
    mockPrisma.user.update.mockResolvedValue(adoptedUser);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      ...adoptedUser,
      usageRecords: [],
    });

    const status = await getUsageStatus('user_new_789');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: guestUser.id },
      data: {
        clerkId: 'user_new_789',
        email: 'buyer@example.com',
      },
    });
    expect(status.isBuyerPassActive).toBe(true);
    expect(status.buyerPassExpiresAt).toEqual(expiresAt);
  });
});
