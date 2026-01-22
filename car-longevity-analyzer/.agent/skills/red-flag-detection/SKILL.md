---
name: Red Flag Detection
description: Identifying potential issues with vehicles
---

# Red Flag Detection Skill

## Description
This skill provides patterns and logic for detecting potential fraud, scams, or issues in car listings.

## When to Use
Activate this skill when:
- Analyzing listing text for red flags
- Generating warnings for users
- Creating questions for sellers

## Red Flag Categories

### Critical (Automatic PASS)
```typescript
const CRITICAL_FLAGS = [
  { pattern: /salvage\s*title/i, message: 'Salvage title - vehicle was totaled' },
  { pattern: /rebuilt\s*title/i, message: 'Rebuilt title - was previously salvaged' },
  { pattern: /flood\s*(damage|car|vehicle)/i, message: 'Possible flood damage' },
  { pattern: /no\s*vin|vin\s*not\s*available/i, message: 'VIN not provided - major red flag' },
  { pattern: /selling\s*for\s*(a\s*)?(friend|someone|family)/i, message: 'Third-party sale - limited information available' },
];
```

### High Severity
```typescript
const HIGH_FLAGS = [
  { pattern: /cash\s*only.*no\s*test/i, message: 'Cash only with no test drives' },
  { pattern: /parts\s*(car|only|vehicle)/i, message: 'Listed as parts car' },
  { pattern: /does\s*n[o']t\s*(run|start|drive)/i, message: 'Vehicle does not run' },
  { pattern: /needs?\s*(major|engine|transmission)\s*(work|repair)/i, message: 'Needs major repairs' },
];
```

### Medium Severity
```typescript
const MEDIUM_FLAGS = [
  { pattern: /as[\s-]*is/i, message: 'Sold as-is - no warranty' },
  { pattern: /mechanic'?s?\s*special/i, message: 'Mechanic\'s special - needs work' },
  { pattern: /must\s*sell\s*(today|fast|quick|asap)/i, message: 'Pressure to sell quickly' },
  { pattern: /minor\s*(accident|damage|fender)/i, message: 'Mentions accident - verify details' },
  { pattern: /check\s*engine\s*light/i, message: 'Check engine light on' },
];
```

### Low Severity (Informational)
```typescript
const LOW_FLAGS = [
  { pattern: /high(er)?\s*mile(age|s)?/i, message: 'High mileage acknowledged' },
  { pattern: /no\s*(low\s*)?ball(ers)?/i, message: 'Firm on price' },
  { pattern: /text\s*only/i, message: 'Text communication only' },
];
```

## Positive Indicators
```typescript
const POSITIVE_INDICATORS = [
  { pattern: /one\s*owner/i, message: 'Single owner vehicle' },
  { pattern: /maintenance\s*records?/i, message: 'Maintenance records available' },
  { pattern: /garage\s*kept/i, message: 'Garage kept' },
  { pattern: /no\s*(accidents?|damage)/i, message: 'No accidents reported' },
  { pattern: /new(ly)?\s*(replaced|installed).*(timing|brakes|tires)/i, message: 'Recent maintenance completed' },
  { pattern: /carfax\s*(available|clean|provided)/i, message: 'Carfax available' },
];
```

## Price Anomaly Detection
```typescript
function detectPriceAnomaly(
  askingPrice: number,
  fairPriceLow: number,
  fairPriceHigh: number
): RedFlag | null {
  const percentBelowLow = ((fairPriceLow - askingPrice) / fairPriceLow) * 100;
  
  if (percentBelowLow > 30) {
    return {
      type: 'price_anomaly',
      severity: 'high',
      message: `Price is ${Math.round(percentBelowLow)}% below market - potential scam or hidden issues`,
      advice: 'Be very cautious. If it seems too good to be true, it probably is.',
    };
  }
  
  if (percentBelowLow > 15) {
    return {
      type: 'price_anomaly', 
      severity: 'medium',
      message: 'Price is significantly below market',
      advice: 'Ask why the price is low. Check for hidden issues.',
    };
  }
  
  return null;
}
```

## Questions Generator
```typescript
function generateQuestionsForSeller(
  vehicle: VehicleInfo,
  redFlags: RedFlag[],
  recalls: Recall[]
): string[] {
  const questions: string[] = [];
  
  // Always ask these
  questions.push('Do you have maintenance records I can review?');
  questions.push('Has the vehicle been in any accidents?');
  questions.push('Why are you selling?');
  
  // Add recall questions
  if (recalls.length > 0) {
    questions.push(`Has the ${recalls[0].component} recall been completed?`);
  }
  
  // Add red flag specific questions
  redFlags.forEach(flag => {
    if (flag.questionToAsk) {
      questions.push(flag.questionToAsk);
    }
  });
  
  // Vehicle-specific questions based on known issues
  const knownIssueQuestions = getKnownIssueQuestions(vehicle);
  questions.push(...knownIssueQuestions);
  
  return questions.slice(0, 6); // Limit to 6 questions
}
```
