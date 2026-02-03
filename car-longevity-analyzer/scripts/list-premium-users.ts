import { prisma } from '../lib/db';

async function main() {
  console.log('=== Premium Users ===\n');

  const premiumUsers = await prisma.user.findMany({
    where: { plan: 'PREMIUM' },
    orderBy: { createdAt: 'desc' },
  });

  if (premiumUsers.length === 0) {
    console.log('No premium users found.');
  } else {
    premiumUsers.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email}`);
      console.log(`   ClerkId: ${user.clerkId}`);
      console.log(`   StripeCustomerId: ${user.stripeCustomerId || 'N/A'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
  }

  console.log(`Total Premium Users: ${premiumUsers.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
