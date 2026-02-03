# Car Longevity Analyzer

A Next.js application that analyzes used vehicles for reliability, longevity, and pricing to help buyers make informed decisions.

**Entry Points:**
- VIN Analysis: `POST /api/analyze/vin` - Decodes VIN via NHTSA, calculates scores
- Listing Analysis: `POST /api/analyze/listing` - Uses AI to extract vehicle info from listing text

**Core Problem:** Help users evaluate whether a used car is a good purchase based on reliability data, lifespan estimation, and red flag detection.

## Tech Stack

- **Framework:** Next.js 16.1.4 with App Router
- **React:** 19.2.3
- **TypeScript:** 5.x (strict mode)
- **Styling:** Tailwind CSS 4 with tw-animate-css
- **Components:** shadcn/ui (Radix primitives)
- **Validation:** Zod 4.3.5
- **Database:** Prisma 7.3.0
- **Testing:** Vitest 3.x
- **AI:** OpenAI API (gpt-4o-mini)

**Path Alias:** `@/*` maps to `car-longevity-analyzer/`

## Project Structure

```
car-longevity-analyzer/
  app/
    api/analyze/
      vin/route.ts        # VIN-based analysis endpoint
      listing/route.ts    # Text listing analysis endpoint
    results/page.tsx      # Results display page
    page.tsx              # Home page with input forms
    layout.tsx            # Root layout
  lib/
    scoring.ts            # Core scoring algorithms
    pricing.ts            # Fair market price estimation
    lifespan-factors.ts   # 8-category lifespan adjustment system
    red-flags.ts          # Red flag detection patterns
    nhtsa.ts              # NHTSA API integration
    reliability-data.ts   # Vehicle reliability database
    constants.ts          # All magic numbers and thresholds
    ai-analyzer.ts        # OpenAI integration for listings
    errors.ts             # Custom error classes
    vin-factor-mapper.ts  # Maps VIN data to lifespan factors
    region-mapper.ts      # Maps location to climate region
  components/
    ui/                   # shadcn/ui components
```

## Scoring System

### Score Weights
- Reliability: 35%
- Longevity: 35%
- Price: 30%

### Recommendation Thresholds
| Verdict | Condition |
|---------|-----------|
| **BUY** | Score >= 7.5 |
| **MAYBE** | Score >= 5.0 |
| **PASS** | Score < 5.0 OR has critical red flag |

### Red Flag Penalties
| Severity | Penalty |
|----------|---------|
| Critical | -5.0 (automatic PASS) |
| High | -1.0 |
| Medium | -0.5 |
| Low | -0.25 |

### Score Scale (1-10)
- 8-10: Excellent
- 6-8: Good
- 4-6: Average
- 2-4: Below Average
- 1-2: Poor

## Lifespan Adjustment Factors

Eight categories affect expected vehicle lifespan (see `lib/lifespan-factors.ts`):

| Category | Best | Worst |
|----------|------|-------|
| Transmission | Manual +8% | CVT -15% |
| Drivetrain | FWD/RWD baseline | 4WD -7% |
| Engine | Electric +20% | Supercharged -10% |
| Maintenance | Excellent +15% | Poor -20% |
| Driving | Highway +10% | Severe -20% |
| Climate | Moderate +5% | Rust Belt -15% |
| Accidents | None +5% | Severe -30% |
| Ownership | Single owner +8% | Multiple -5% |

**Bounds:** Total multiplier clamped to 0.5x - 1.5x of base lifespan.

**Confidence Levels:**
- High: 5+ known factors
- Medium: 2-4 known factors
- Low: 0-1 known factors

## API Response Format

### Success Response
```json
{
  "success": true,
  "vehicle": { "make": "", "model": "", "year": 0 },
  "scores": { "reliability": 0, "longevity": 0, "priceValue": 0, "overall": 0 },
  "longevity": { "expectedLifespan": 0, "estimatedRemainingMiles": 0, "percentUsed": 0 },
  "pricing": { "askingPrice": 0, "fairPriceLow": 0, "fairPriceHigh": 0, "dealQuality": "" },
  "recalls": [],
  "redFlags": [],
  "recommendation": { "verdict": "", "confidence": "", "summary": "" }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [],
  "retryable": false
}
```

### HTTP Status Codes
- 200: Success
- 400: Validation error
- 404: VIN/vehicle not found
- 429: Rate limited
- 500: Server error (retryable)
- 503: External service unavailable

### Input Limits
- VIN: Exactly 17 characters, no I/O/Q
- Mileage: Max 1,000,000
- Price: Max $10,000,000
- Listing text: Max 15,000 characters

## External APIs

### NHTSA (No API key required)
```
VIN Decode:    GET https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json
Recalls:       GET https://api.nhtsa.gov/recalls/recallsByVehicle?make={}&model={}&modelYear={}
Complaints:    GET https://api.nhtsa.gov/complaints/complaintsByVehicle?make={}&model={}&modelYear={}
Safety:        GET https://api.nhtsa.gov/SafetyRatings/modelyear/{}/make/{}/model/{}
```

**Rate Limiting:** 100ms delay between calls (`API_TIMEOUTS.nhtsaDelay`)

### OpenAI
- Model: gpt-4o-mini
- Requires: `OPENAI_API_KEY` environment variable
- Fallback: Returns basic analysis if unavailable

## Code Patterns

### API Routes
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = Schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: result.error.issues },
        { status: 400 }
      );
    }
    // ... logic
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "..." }, { status: 500 });
  }
}
```

### Error Handling
- Use `Promise.allSettled()` for parallel API calls with graceful degradation
- Custom error classes in `lib/errors.ts`
- Always return consistent response format

### Constants
- Never hardcode thresholds - import from `lib/constants.ts`
- All scoring weights, penalties, and limits are centralized

## Testing

```bash
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Run with coverage
```

Tests are colocated with source files (`lib/*.test.ts`).

## UI Verification

**Playwright MCP** is configured for real-time browser verification. After any UI changes:

1. Ensure dev server is running (`npm run dev`)
2. Use Playwright MCP tools:
   - `browser_navigate` to `http://localhost:3000`
   - `browser_screenshot` to verify UI renders correctly
   - `browser_click`, `browser_type` to test interactions
3. Save screenshots to `screenshots/` directory

**E2E Tests** for regression testing:
```bash
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Interactive mode
```

E2E tests are in `e2e/` directory. Screenshots save to `e2e/screenshots/`.

## Common Tasks

### Adding a Vehicle to Reliability Database
Edit `lib/reliability-data.ts`:
```typescript
{ make: 'Brand', model: 'Model', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2015, 2016] }
```

### Adding a Red Flag Pattern
Edit `lib/red-flags.ts`, add to appropriate array:
```typescript
{ pattern: /regex/i, message: "Warning message", advice: "What to do", type: "pattern" }
```

### Modifying Scoring Weights
Edit `lib/constants.ts`:
- `SCORE_WEIGHTS` - reliability/longevity/price weights
- `RED_FLAG_PENALTIES` - severity penalties
- `RECOMMENDATION_THRESHOLDS` - BUY/MAYBE/PASS thresholds

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string

**Optional:**
- `OPENAI_API_KEY` - Enables AI-powered listing analysis

**NEVER TOUCH THE .env FILE**

## Before Starting Any Task

  ALWAYS ask clarifying questions before writing code. Consider:
  - What are the edge cases?
  - What's the expected behavior on failure?
  - Are there performance constraints?
  - What's the scope boundary - what should this NOT do?
  - Are there existing patterns in the codebase to follow?

  Do not proceed until you've asked at least 3 relevant questions.