# Test Coverage Analysis

**Generated:** 2026-01-26
**Current Test Count:** 112 tests across 4 files
**Overall Line Coverage:** 16.82%

## Executive Summary

The codebase has strong test coverage for mathematical scoring and pricing algorithms but lacks tests for critical pattern detection, external API integrations, and data mapping modules. This document identifies gaps and prioritizes areas for improvement.

---

## Current Coverage Metrics

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   16.82 |    83.62 |   79.62 |   16.82 |
lib/scoring.ts     |   97.29 |    90.78 |     100 |   97.29 |
lib/pricing.ts     |     100 |     87.5 |     100 |     100 |
lib/reliability-   |   87.67 |    70.58 |     100 |   87.67 |
  data.ts          |         |          |         |         |
lib/lifespan-      |     100 |    89.28 |     100 |     100 |
  factors.ts       |         |          |         |         |
lib/constants.ts   |     100 |      100 |     100 |     100 |
lib/red-flags.ts   |       0 |      100 |     100 |       0 |
lib/nhtsa.ts       |       0 |        0 |       0 |       0 |
lib/vin-factor-    |       0 |      100 |     100 |       0 |
  mapper.ts        |         |          |         |         |
lib/region-        |       0 |      100 |     100 |       0 |
  mapper.ts        |         |          |         |         |
lib/rate-limit.ts  |       0 |      100 |     100 |       0 |
lib/ai-analyzer.ts |       0 |        0 |       0 |       0 |
lib/errors.ts      |       0 |      100 |     100 |       0 |
API routes         |       0 |        0 |       0 |       0 |
-------------------|---------|----------|---------|---------|
```

---

## Well-Tested Modules ✅

### 1. `lib/scoring.ts` (97.29% coverage, 36 tests)
- Reliability, longevity, and price scoring algorithms
- Overall score calculation with weighted averages
- Recommendation thresholds (BUY, MAYBE, PASS)
- Red flag penalty application
- Edge cases for NaN, Infinity, and boundary values

### 2. `lib/pricing.ts` (100% coverage, 22 tests)
- MSRP database lookups
- Depreciation curve calculations
- Mileage adjustments
- Brand retention multipliers
- Fair price range estimation

### 3. `lib/reliability-data.ts` (87.67% coverage, 25 tests)
- Reliability database lookups
- Fuzzy matching for model names
- Case-insensitive searches
- Trim level normalization

### 4. `lib/lifespan-factors.ts` (100% coverage, 29 tests)
- Multi-factor lifespan adjustment calculations
- Transmission, engine, drivetrain impacts
- Maintenance and ownership history factors
- Climate region adjustments
- Confidence level calculations

---

## Untested Modules ❌

### HIGH PRIORITY

#### 1. `lib/red-flags.ts` (0% coverage)
**Risk:** Pattern detection failures could miss critical vehicle issues.

**What needs testing:**
- `detectRedFlags()` - 20+ regex patterns across 4 severity levels
  - CRITICAL: salvage title, rebuilt title, flood damage, no VIN, third-party sale
  - HIGH: cash only, parts car, doesn't run, needs major repairs
  - MEDIUM: as-is, mechanic's special, pressure selling, accident mentions
  - LOW: high mileage, firm pricing, text-only communication
- `detectPriceAnomaly()` - Price anomaly thresholds (>30% = high, >15% = medium)
- `detectPositiveIndicators()` - 6 positive patterns (one owner, maintenance records, etc.)
- `generateQuestionsForSeller()` - Question generation based on flags and recalls

**Test scenarios needed:**
```typescript
// Pattern detection
detectRedFlags('salvage title') // → critical flag
detectRedFlags('SALVAGE TITLE') // → case insensitive
detectRedFlags('as-is sale') // → medium flag
detectRedFlags('one owner, garage kept') // → 0 flags (these are positive)

// Price anomaly
detectPriceAnomaly(5000, 10000, 12000) // → high severity (50% below)
detectPriceAnomaly(8000, 10000, 12000) // → medium severity (20% below)
detectPriceAnomaly(11000, 10000, 12000) // → null (fair price)

// Questions generation
generateQuestionsForSeller(vehicle, [salvageFlag], [recall]) // → relevant questions
```

---

#### 2. `lib/nhtsa.ts` (0% coverage)
**Risk:** External API failures could crash the application or return invalid data.

**What needs testing:**
- `decodeVin()` - VIN to vehicle details conversion
- `getRecalls()` - Safety recall fetching
- `getComplaints()` - Consumer complaint fetching
- `getSafetyRatings()` - NHTSA safety ratings

**Test scenarios needed:**
```typescript
// Mock successful responses
decodeVin('1HGCM82633A123456') // → valid vehicle details

// Mock error scenarios
decodeVin('INVALID') // → null (invalid VIN)
decodeVin('NETWORK_ERROR') // → null (handles fetch failure)

// Mock empty responses
getRecalls('Unknown', 'Model', 2020) // → []
getSafetyRatings('Rare', 'Car', 2015) // → null (not rated)

// Validate Zod schema parsing
// Malformed API responses should be caught
```

---

#### 3. `lib/vin-factor-mapper.ts` (0% coverage)
**Risk:** Incorrect factor mapping leads to wrong lifespan predictions.

**What needs testing:**
- `mapDriveType()` - Drivetrain string normalization
- `mapEngineType()` - Engine type detection from fuel/device strings
- `inferTransmissionType()` - CVT detection for known models
- `mapVinToLifespanFactors()` - Full VIN-to-factors conversion
- `mergeLifespanFactors()` - Priority merging of VIN/AI/climate factors

**Test scenarios needed:**
```typescript
// Drive type mapping
mapDriveType('Front Wheel Drive') // → 'fwd'
mapDriveType('AWD') // → 'awd'
mapDriveType('4X4') // → '4wd'
mapDriveType(undefined) // → 'unknown'

// Engine type with turbo detection
mapEngineType('Gasoline', '2.0L 4-Cyl Turbo') // → 'turbo'
mapEngineType('Electric', undefined) // → 'electric'

// CVT inference
inferTransmissionType('Nissan', 'Altima', 2015) // → 'cvt'
inferTransmissionType('Toyota', 'Camry', 2018) // → 'automatic'
inferTransmissionType('Subaru', 'Outback', 2012) // → 'cvt'

// Factor merging priority
mergeLifespanFactors(vinFactors, aiFactors, climate)
// VIN factors take precedence for drivetrain/transmission
// AI factors take precedence for maintenance/accidents
```

---

#### 4. API Routes (0% coverage)
**Risk:** End-to-end failures not caught before deployment.

**`/api/analyze/vin/route.ts`** needs:
- Valid VIN analysis flow
- Missing required field validation (vin, mileage, askingPrice)
- Invalid VIN format handling
- Rate limiting enforcement
- NHTSA API failure graceful degradation

**`/api/analyze/listing/route.ts`** needs:
- Valid listing analysis flow
- Listing text length validation (10-15000 chars)
- AI extraction failure handling
- Vehicle not found in reliability database

---

### MEDIUM PRIORITY

#### 5. `lib/region-mapper.ts` (0% coverage)
**Risk:** Incorrect climate mapping affects lifespan predictions for specific states.

**What needs testing:**
- `getClimateRegion()` - All 50 states + DC mapped correctly
- Full state name to code conversion
- Case insensitivity and trimming
- `getClimateDescription()` - Returns appropriate descriptions
- `getStatesInRegion()` - Returns correct state lists

**Test scenarios needed:**
```typescript
// State code lookup
getClimateRegion('OH') // → 'rust_belt'
getClimateRegion('AZ') // → 'extreme_heat'
getClimateRegion('FL') // → 'coastal_salt'
getClimateRegion('CA') // → 'moderate'

// Full name conversion
getClimateRegion('MICHIGAN') // → 'rust_belt'
getClimateRegion('california') // → 'moderate'

// Edge cases
getClimateRegion('XX') // → 'unknown'
getClimateRegion('') // → 'unknown'
getClimateRegion(undefined) // → 'unknown'
```

---

#### 6. `lib/rate-limit.ts` (0% coverage)
**Risk:** Rate limiting bugs could allow API abuse or block legitimate users.

**What needs testing:**
- `checkRateLimit()` - Allows requests under limit, blocks over limit
- Sliding window behavior (old requests expire)
- `remaining`, `resetAt`, `retryAfterMs` calculations
- `getClientIdentifier()` - Header extraction priority
- `resetRateLimit()` and `clearAllRateLimits()` - Reset functions

**Test scenarios needed:**
```typescript
// Basic rate limiting
checkRateLimit('user1', 5, 60000) // → allowed: true, remaining: 4
// ... 4 more requests ...
checkRateLimit('user1', 5, 60000) // → allowed: false, retryAfterMs: ~60000

// Header extraction
getClientIdentifier(req with 'x-forwarded-for: 1.2.3.4') // → '1.2.3.4'
getClientIdentifier(req with 'x-real-ip: 5.6.7.8') // → '5.6.7.8'
getClientIdentifier(req with neither) // → 'ua:hash'

// Reset functions
resetRateLimit('user1') // → user1 limit cleared
clearAllRateLimits() // → all limits cleared
```

---

### LOW PRIORITY

#### 7. `lib/errors.ts` (0% coverage)
**What needs testing:**
- Custom error class instantiation
- `getUserFriendlyMessage()` - Error to user message conversion
- `isRetryableError()` - Retry logic for specific error types

#### 8. `lib/ai-analyzer.ts` (0% coverage)
**Note:** Requires mocking OpenAI client. Lower priority due to complexity.
- Input sanitization
- AI response parsing
- Error handling for API failures

---

## Recommended Test Implementation Order

### Phase 1: Core Business Logic (Target: 40% coverage)
1. ✅ Already done: scoring, pricing, reliability-data, lifespan-factors
2. **Add:** `red-flags.test.ts` - Pattern detection
3. **Add:** `vin-factor-mapper.test.ts` - Data mapping

### Phase 2: External Integrations (Target: 60% coverage)
4. **Add:** `nhtsa.test.ts` - Mocked API tests
5. **Add:** `rate-limit.test.ts` - Security testing
6. **Add:** `region-mapper.test.ts` - Geographic mapping

### Phase 3: End-to-End (Target: 80% coverage)
7. **Add:** API route integration tests
8. **Add:** `ai-analyzer.test.ts` - Mocked OpenAI tests
9. **Add:** `errors.test.ts` - Error utilities

---

## Test Infrastructure Recommendations

### 1. Add Mock Utilities
Create `/lib/__mocks__/` directory with:
- `nhtsa.ts` - Mock NHTSA API responses
- `openai.ts` - Mock OpenAI client
- `fetch.ts` - Global fetch mock helper

### 2. Add Test Fixtures
Create `/lib/__fixtures__/` directory with:
- `vins.ts` - Sample VINs with expected decode results
- `listings.ts` - Sample listing texts with expected extractions
- `api-responses.ts` - Sample NHTSA/OpenAI responses

### 3. Configure Coverage Thresholds
Update `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 60,
        branches: 70,
        functions: 80,
        lines: 60,
      },
    },
  },
});
```

---

## Summary

| Priority | Module | Current | Effort | Impact |
|----------|--------|---------|--------|--------|
| 🔴 HIGH | red-flags.ts | 0% | Medium | High - Pattern detection |
| 🔴 HIGH | nhtsa.ts | 0% | High | High - API reliability |
| 🔴 HIGH | vin-factor-mapper.ts | 0% | Medium | High - Lifespan accuracy |
| 🔴 HIGH | API routes | 0% | High | High - E2E validation |
| 🟡 MEDIUM | region-mapper.ts | 0% | Low | Medium - Geographic accuracy |
| 🟡 MEDIUM | rate-limit.ts | 0% | Medium | Medium - Security |
| 🟢 LOW | errors.ts | 0% | Low | Low - Error handling |
| 🟢 LOW | ai-analyzer.ts | 0% | High | Medium - AI extraction |

Addressing the HIGH priority items would bring coverage to approximately 50-60% and cover the most critical business logic paths.
