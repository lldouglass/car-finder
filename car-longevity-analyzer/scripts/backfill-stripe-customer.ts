/**
 * Backfill stripeCustomerId for existing premium users.
 *
 * Usage:
 *   npx tsx scripts/backfill-stripe-customer.ts <clerkId> <stripeCustomerId>
 *
 * Example:
 *   npx tsx scripts/backfill-stripe-customer.ts user_abc123 cus_xyz789
 *
 * To find the stripeCustomerId:
 * 1. Go to Stripe Dashboard → Customers
 * 2. Find the customer by email or search
 * 3. Copy the customer ID (starts with cus_)
 */

import { prisma } from '../lib/db';

async function main() {
  const [clerkId, stripeCustomerId] = process.argv.slice(2);

  if (!clerkId || !stripeCustomerId) {
    console.error('Usage: npx tsx scripts/backfill-stripe-customer.ts <clerkId> <stripeCustomerId>');
    console.error('Example: npx tsx scripts/backfill-stripe-customer.ts user_abc123 cus_xyz789');
    process.exit(1);
  }

  if (!stripeCustomerId.startsWith('cus_')) {
    console.error('Warning: stripeCustomerId should start with "cus_"');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    console.error(`User not found with clerkId: ${clerkId}`);
    process.exit(1);
  }

  console.log(`Found user:`);
  console.log(`  ClerkId: ${user.clerkId}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  Current StripeCustomerId: ${user.stripeCustomerId || 'N/A'}`);
  console.log('');

  const updated = await prisma.user.update({
    where: { clerkId },
    data: { stripeCustomerId },
  });

  console.log(`Updated user with stripeCustomerId: ${updated.stripeCustomerId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
