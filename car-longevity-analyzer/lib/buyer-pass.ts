export const BUYER_PASS_PRICE = '$12';
export const BUYER_PASS_TERM = '30 days';
export const BUYER_PASS_OFFER = `${BUYER_PASS_PRICE} one-time for ${BUYER_PASS_TERM}`;

export const buyerPassComparison = [
  {
    feature: 'Year, make, model reliability check',
    free: 'Unlimited',
    buyerPass: 'Included',
  },
  {
    feature: 'VIN-specific reports',
    free: '3 per month with a free account',
    buyerPass: 'Unlimited for 30 days',
  },
  {
    feature: 'Recall and complaint snapshots',
    free: 'Included',
    buyerPass: 'Included',
  },
  {
    feature: 'Fair price range',
    free: 'Not included',
    buyerPass: 'Included',
  },
  {
    feature: 'Negotiation talking points',
    free: 'Not included',
    buyerPass: 'Included',
  },
  {
    feature: 'Maintenance cost projection',
    free: 'Not included',
    buyerPass: 'Included',
  },
  {
    feature: 'Pre-purchase checklist',
    free: 'Not included',
    buyerPass: 'Included',
  },
] as const;

export const buyerPassFaqs = [
  {
    question: 'Is Buyer Pass a subscription?',
    answer:
      'No. Buyer Pass is a one-time payment for 30 days of access. There is no recurring billing to cancel.',
  },
  {
    question: 'Who should buy Buyer Pass?',
    answer:
      'It is built for shoppers who already have a specific car, VIN, or listing in mind and want pricing, negotiation notes, and likely ownership costs before buying.',
  },
  {
    question: 'What is still free?',
    answer:
      'You can still run free year, make, and model checks to compare reliability, recalls, and overall ownership risk before deciding whether you need a deeper paid report.',
  },
  {
    question: 'How fast do I get access?',
    answer:
      'Immediately after checkout. Once Buyer Pass is active, VIN reports and paid buyer tools are available right away for the next 30 days.',
  },
] as const;
