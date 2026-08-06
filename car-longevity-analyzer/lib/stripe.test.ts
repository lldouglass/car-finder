import { beforeEach, describe, expect, it, vi } from 'vitest';

const { retrievePrice, createSession } = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  process.env.BUYER_PASS_PRICE_ID = 'price_buyer_pass';
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

  return {
    retrievePrice: vi.fn(),
    createSession: vi.fn(),
  };
});

vi.mock('stripe', () => ({
  default: function StripeMock() {
    return {
      prices: { retrieve: retrievePrice },
      checkout: { sessions: { create: createSession } },
      webhooks: { constructEvent: vi.fn() },
    };
  },
}));

import { createCheckoutSession } from './stripe';

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retrievePrice.mockResolvedValue({
      id: 'price_buyer_pass',
      active: true,
      type: 'one_time',
      recurring: null,
    });
    createSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    });
  });

  it('lets a guest enter their email in Stripe Checkout without Clerk metadata', async () => {
    await createCheckoutSession(null, null);

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_creation: 'always',
        metadata: {
          purchaseType: 'buyer_pass',
          buyerPassPriceId: 'price_buyer_pass',
        },
      })
    );

    const checkoutOptions = createSession.mock.calls[0][0];
    expect(checkoutOptions).not.toHaveProperty('customer_email');
    expect(checkoutOptions.metadata).not.toHaveProperty('clerkId');
  });

  it('prefills email and retains Clerk ownership for a signed-in buyer', async () => {
    await createCheckoutSession('user_123', 'buyer@example.com');

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'buyer@example.com',
        metadata: expect.objectContaining({
          clerkId: 'user_123',
          purchaseType: 'buyer_pass',
        }),
      })
    );
  });
});
