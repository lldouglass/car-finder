---
name: Scoring Engine
description: Logic for calculating vehicle longevity scores
---

# Vehicle Scoring Engine Skill

## Description
This skill provides the algorithms and logic for scoring vehicles on reliability, longevity, and price value.

## When to Use
Activate this skill when implementing:
- Reliability score calculation
- Longevity/remaining life estimation
- Price analysis and deal quality scoring
- Overall recommendation logic

## Scoring Algorithms

### Reliability Score (1-10)

Based on make/model/year with adjustments for known issues.
```typescript
interface ReliabilityData {
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  baseScore: number; // 1-10
  expectedLifespanMiles: number;
}

// Tier 1: Excellent (8-10)
const TIER_1 = ['Toyota Camry', 'Toyota Corolla', 'Honda Accord', 'Honda Civic', 'Lexus ES', 'Lexus RX'];

// Tier 2: Good (6-8)  
const TIER_2 = ['Subaru Outback', 'Mazda CX-5', 'Hyundai Sonata', 'Ford F-150'];

// Tier 3: Average (4-6)
const TIER_3 = ['Nissan Altima', 'Jeep Cherokee', 'Volkswagen Jetta'];

function calculateReliabilityScore(
  make: string,
  model: string,
  year: number,
  knownIssues: KnownIssue[]
): number {
  // 1. Get base score from tier
  let baseScore = getBaseScore(make, model);
  
  // 2. Apply year-specific adjustments
  const yearAdjustment = getYearAdjustment(make, model, year);
  
  // 3. Deduct for known issues
  const issuePenalty = knownIssues.reduce((penalty, issue) => {
    switch (issue.severity) {
      case 'critical': return penalty + 1.5;
      case 'major': return penalty + 0.8;
      case 'moderate': return penalty + 0.3;
      case 'minor': return penalty + 0.1;
      default: return penalty;
    }
  }, 0);
  
  return Math.max(1, Math.min(10, baseScore + yearAdjustment - issuePenalty));
}
```

### Longevity Score (1-10)

Based on expected lifespan minus current mileage.
```typescript
interface LongevityResult {
  score: number;
  remainingMiles: number;
  remainingYears: number;
  percentUsed: number;
}

function calculateLongevityScore(
  expectedLifespan: number, // e.g., 250000
  currentMileage: number,   // e.g., 120000
  annualMiles: number = 12000
): LongevityResult {
  const remainingMiles = Math.max(0, expectedLifespan - currentMileage);
  const percentUsed = (currentMileage / expectedLifespan) * 100;
  const percentRemaining = 100 - percentUsed;
  
  // Convert to 1-10 scale (100% remaining = 10, 0% = 1)
  const score = 1 + (percentRemaining / 100) * 9;
  
  return {
    score: Math.round(score * 10) / 10,
    remainingMiles,
    remainingYears: Math.round(remainingMiles / annualMiles),
    percentUsed: Math.round(percentUsed),
  };
}
```

### Price Score (1-10)

Based on asking price vs fair market range.
```typescript
interface PriceResult {
  score: number;
  dealQuality: 'GREAT' | 'GOOD' | 'FAIR' | 'HIGH' | 'OVERPRICED';
  analysis: string;
}

function calculatePriceScore(
  askingPrice: number,
  fairPriceLow: number,
  fairPriceHigh: number
): PriceResult {
  const midpoint = (fairPriceLow + fairPriceHigh) / 2;
  const range = fairPriceHigh - fairPriceLow;
  
  // Deviation from midpoint (-1 = great deal, +1 = overpriced)
  const deviation = (askingPrice - midpoint) / (range || 1);
  
  // Convert to 1-10 (lower price = higher score)
  const score = Math.max(1, Math.min(10, 7 - (deviation * 3)));
  
  // Determine deal quality
  let dealQuality: PriceResult['dealQuality'];
  if (askingPrice < fairPriceLow * 0.85) dealQuality = 'GREAT';
  else if (askingPrice < fairPriceLow) dealQuality = 'GOOD';
  else if (askingPrice <= fairPriceHigh) dealQuality = 'FAIR';
  else if (askingPrice <= fairPriceHigh * 1.1) dealQuality = 'HIGH';
  else dealQuality = 'OVERPRICED';
  
  return {
    score: Math.round(score * 10) / 10,
    dealQuality,
    analysis: generatePriceAnalysis(askingPrice, fairPriceLow, fairPriceHigh, dealQuality),
  };
}
```

### Overall Score & Recommendation
```typescript
type Recommendation = 'BUY' | 'MAYBE' | 'PASS';

interface OverallResult {
  score: number;
  recommendation: Recommendation;
  confidence: number;
  summary: string;
}

function calculateOverall(
  reliability: number,
  longevity: number,
  price: number,
  redFlagCount: number,
  hasCriticalRedFlag: boolean
): OverallResult {
  // Weighted average (reliability and longevity weighted higher)
  const baseScore = (
    reliability * 0.35 +
    longevity * 0.35 +
    price * 0.30
  );
  
  // Red flag penalties
  const penalty = (redFlagCount * 0.2) + (hasCriticalRedFlag ? 2.0 : 0);
  const finalScore = Math.max(1, baseScore - penalty);
  
  // Determine recommendation
  let recommendation: Recommendation;
  if (hasCriticalRedFlag) recommendation = 'PASS';
  else if (finalScore >= 7) recommendation = 'BUY';
  else if (finalScore >= 5) recommendation = 'MAYBE';
  else recommendation = 'PASS';
  
  // Confidence based on data completeness
  const confidence = calculateConfidence(/* factors */);
  
  return {
    score: Math.round(finalScore * 10) / 10,
    recommendation,
    confidence,
    summary: generateSummary(recommendation, reliability, longevity, price),
  };
}
```
