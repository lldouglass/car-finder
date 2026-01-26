# Car Longevity Analyzer - Score Calculation Reference

This document details how each score is calculated in the Car Longevity Analyzer application.

---

## Table of Contents

1. [Overall Score](#1-overall-score)
2. [Reliability Score](#2-reliability-score)
3. [Longevity Score](#3-longevity-score)
4. [Safety Score](#4-safety-score)
5. [Value Score](#5-value-score)
6. [Red Flag System](#6-red-flag-system)
7. [Lifespan Adjustment Factors](#7-lifespan-adjustment-factors)

---

## 1. Overall Score

**File:** `lib/scoring.ts` (`calculateOverallScore`)

### Formula

```
baseScore = (reliability × 0.30) + (longevity × 0.30) + (price × 0.25) + (safety × 0.15)
finalScore = baseScore - redFlagPenalties
```

### Weights

| Component   | Weight |
|-------------|--------|
| Reliability | 30%    |
| Longevity   | 30%    |
| Price/Value | 25%    |
| Safety      | 15%    |

If safety data is unavailable, weights are redistributed proportionally among the other three scores.

### Red Flag Penalties

| Severity | Penalty |
|----------|---------|
| Critical | -5.0    |
| High     | -1.0    |
| Medium   | -0.5    |
| Low      | -0.25   |

Note: Multiple medium/low flags accumulate; critical and high penalties are applied once each if any flag of that severity exists.

### Recommendation Thresholds

| Score Range     | Recommendation |
|-----------------|----------------|
| ≥ 7.5           | **BUY**        |
| ≥ 5.0 and < 7.5 | **MAYBE**      |
| < 5.0           | **PASS**       |

A vehicle with any **critical** red flag or a final score below 3.0 automatically receives a **PASS** recommendation.

### Confidence Calculation

- **0.85** if all component scores differ from default (5.0)
- **0.65** if any component is at default

---

## 2. Reliability Score

**File:** `lib/scoring.ts` (`calculateReliabilityScore`, `calculateReliabilityFromComplaints`)

### Base Score Method

```
finalScore = baseScore + yearAdjustment - issuePenalty
```

**Base Score:** Retrieved from vehicle database (make/model specific), defaults to 5.0 if unknown.

### Year Adjustments

| Condition                        | Adjustment |
|----------------------------------|------------|
| Model year ≥ 2018                | +0.5       |
| Year in "years to avoid" list    | -2.0       |

### Known Issue Penalties

| Severity | Penalty |
|----------|---------|
| CRITICAL | -2.0    |
| MAJOR    | -1.2    |
| MODERATE | -0.5    |
| MINOR    | -0.1    |

### NHTSA Complaint-Based Calculation

When NHTSA complaint data is available:

#### Complaint Severity Weights

| Incident Type | Weight |
|---------------|--------|
| Deaths        | 50     |
| Injuries      | 20     |
| Fire          | 15     |
| Crash         | 10     |
| Default       | 1      |

#### Calculation Steps

1. **Total severity score** = Sum of weights for all complaints
2. **Age-normalized score** = totalSeverityScore / vehicleAge
3. **Count penalty** = log₁₀(complaintCount + 1) × 2
4. **Raw badness** = (ageNormalizedScore / 5) + countPenalty
5. **Calculated score** = 10 - rawBadness (clamped to 1-10)

#### Blending with Fallback

- If complaints < 5: `score = (calculated × complaintCount/5) + (fallback × (1 - complaintCount/5))`
- Otherwise: `score = (calculated × 0.7) + (fallback × 0.3)`
- No complaints: `score = (fallback + 6.5) / 2`

---

## 3. Longevity Score

**File:** `lib/scoring.ts` (`calculateLongevityScore`)

### Formula

```
percentUsed = (currentMileage / expectedLifespan) × 100
percentRemaining = 100 - percentUsed
score = 1 + (percentRemaining / 100) × 9
```

### Score Mapping

| Percent Remaining | Score |
|-------------------|-------|
| 100%              | 10.0  |
| 75%               | 7.75  |
| 50%               | 5.5   |
| 25%               | 3.25  |
| 0%                | 1.0   |

### Output Values

- **remainingMiles** = max(0, expectedLifespan - currentMileage)
- **remainingYears** = remainingMiles / annualMiles (default: 12,000)
- **percentUsed** = capped at 100%

### Expected Lifespan

Base lifespan is adjusted using multipliers from `lib/lifespan-factors.ts`. See [Section 7](#7-lifespan-adjustment-factors).

---

## 4. Safety Score

**File:** `lib/safety-scoring.ts` (`calculateSafetyScore`)

### Combined Formula

```
// With crash test data:
finalScore = (crashTestScore × 0.6) + (incidentScore × 0.4)

// Without crash test data:
finalScore = incidentScore
```

### Crash Test Component (60%)

#### Category Weights

| Test Category | Weight |
|---------------|--------|
| Frontal       | 35%    |
| Side          | 30%    |
| Rollover      | 20%    |
| Overall       | 15%    |

#### Star-to-Score Conversion

```
score = weightedAverageStars × 2
```

| Stars | Score |
|-------|-------|
| 5     | 10.0  |
| 4     | 8.0   |
| 3     | 6.0   |
| 2     | 4.0   |
| 1     | 2.0   |

### Incident Component (40%)

#### Incident Weights

| Incident Type | Weight |
|---------------|--------|
| Death         | 100    |
| Injury        | 25     |
| Fire          | 20     |
| Crash         | 10     |

#### Calculation

```
rawPenalty = (deaths × 100) + (injuries × 25) + (fires × 20) + (crashes × 10)
normalizedPenalty = rawPenalty / vehicleAge
score = 10 - log₁₀(normalizedPenalty + 1) × 3
```

### Confidence Levels

| Condition                              | Confidence |
|----------------------------------------|------------|
| Has crash test data + ≥10 complaints   | High       |
| Has crash test data + <10 complaints   | Medium     |
| No crash test data + ≥20 complaints    | Medium     |
| No crash test data + <20 complaints    | Low        |

### Safety Red Flag Thresholds

| Condition                      | Severity | Threshold      |
|--------------------------------|----------|----------------|
| Any deaths reported            | Critical | deaths > 0     |
| High injury count              | High     | injuries ≥ 5   |
| Any injuries (below threshold) | Medium   | injuries > 0   |
| High fire count                | High     | fires ≥ 3      |
| Any fires (below threshold)    | Medium   | fires > 0      |
| Poor crash rating              | Medium   | ≤ 2 stars      |
| High crash count               | Medium   | crashes ≥ 20   |
| Low overall safety score       | Low      | score < 5.0    |

---

## 5. Value Score

**File:** `lib/pricing.ts` (`estimateFairPrice`), `lib/scoring.ts` (`calculatePriceScore`)

### Fair Price Estimation

#### Step 1: Base Depreciation

Depreciation curves by vehicle category (annual retention %):

| Year | Economy | Midsize | SUV   | Truck | Luxury |
|------|---------|---------|-------|-------|--------|
| 1    | 82%     | 80%     | 78%   | 75%   | 72%    |
| 2    | 88%     | 87%     | 86%   | 85%   | 82%    |
| 3    | 90%     | 89%     | 88%   | 88%   | 85%    |
| 4    | 92%     | 91%     | 90%   | 91%   | 88%    |
| 5    | 94%     | 93%     | 93%   | 94%   | 90%    |
| 6+   | 95%     | 95%     | 95%   | 96%   | 92%    |

**Value Floor:** Minimum percentage of MSRP

| Category | Floor |
|----------|-------|
| Economy  | 15%   |
| Midsize  | 12%   |
| SUV      | 18%   |
| Truck    | 20%   |
| Luxury   | 10%   |

#### Step 2: Brand Retention Multiplier

| Brand              | Multiplier |
|--------------------|------------|
| Porsche            | 1.20       |
| Toyota             | 1.18       |
| Lexus, Honda       | 1.15       |
| Subaru             | 1.12       |
| Mazda              | 1.10       |
| Hyundai, Kia, Acura| 1.05       |
| GMC, Ram           | 1.02       |
| Ford, Chevrolet    | 1.00       |
| Jeep               | 0.98       |
| Nissan, VW, Dodge  | 0.95       |
| BMW, Audi          | 0.92       |
| Mercedes-Benz      | 0.90       |
| Infiniti           | 0.88       |
| Cadillac, Lincoln, Land Rover | 0.85 |
| Jaguar             | 0.82       |

#### Step 3: Mileage Adjustment

```
expectedMiles = vehicleAge × 12,000
mileageDiff = actualMileage - expectedMiles
adjustment = (mileageDiff / 10,000) × -0.02
```

- **Maximum adjustment:** ±15%
- **Formula:** `adjustedValue = baseValue × (1 + adjustment)`

#### Step 4: Price Range

```
margin = 8%
midpoint = adjustedValue
low = adjustedValue × 0.92
high = adjustedValue × 1.08
minimum = $2,000
```

### Price Score Calculation

| Asking Price Position | Score Range | Formula |
|-----------------------|-------------|---------|
| Below fair low price  | 7.0 - 10.0  | `7 + (discount / 0.15) × 3` |
| Within fair range     | 4.0 - 7.0   | `7 - (position × 3)` |
| Above fair high price | 1.0 - 4.0   | `4 - (premium / 0.2) × 3` |

Where:
- `discount = (fairLow - asking) / fairLow`
- `position = (asking - fairLow) / range`
- `premium = (asking - fairHigh) / fairHigh`

### Deal Quality Labels

| Condition                       | Label       |
|---------------------------------|-------------|
| Price < 90% of fair low         | **GREAT**   |
| Price < 100% of fair low        | **GOOD**    |
| Price within fair range         | **FAIR**    |
| Price ≤ 115% of fair high       | **HIGH**    |
| Price > 115% of fair high       | **OVERPRICED** |

### Price Anomaly Detection

| Below Market By | Severity | Message |
|-----------------|----------|---------|
| > 30%           | High     | Potential scam warning |
| > 15%           | Medium   | Significantly below market |

---

## 6. Red Flag System

**File:** `lib/red-flags.ts`

### Pattern-Based Detection

Red flags are detected from listing text using regex patterns.

#### Critical Patterns

- Salvage title
- Rebuilt title
- Flood damage
- No VIN / VIN not available
- Third-party sale (selling for friend/family)

#### High Patterns

- Cash only / No test drives
- Parts car
- Does not run/start/drive
- Needs major/engine/transmission work

#### Medium Patterns

- Sold as-is
- Mechanic's special
- Pressure to sell fast
- Minor accident mentioned
- Check engine light on

#### Low Patterns

- High mileage acknowledged
- Firm on price / No lowballers
- Text only communication

### Vehicle History Red Flags

Red flags from NMVTIS/VinAudit data:

| Issue Type   | Possible Severities |
|--------------|---------------------|
| Title brand  | Critical, High, Medium |
| Odometer     | High                |
| Theft record | High                |
| Total loss   | Critical            |

---

## 7. Lifespan Adjustment Factors

**File:** `lib/lifespan-factors.ts`

### Adjustment Formula

```
adjustedLifespan = baseLifespan × totalMultiplier
totalMultiplier = Π(factor multipliers), clamped to [0.5, 1.5]
```

### Transmission Type

| Type      | Multiplier | Impact |
|-----------|------------|--------|
| Manual    | 1.08       | +8%    |
| Automatic | 1.00       | —      |
| DCT       | 0.95       | -5%    |
| CVT       | 0.85       | -15%   |

### Drivetrain

| Type | Multiplier | Impact |
|------|------------|--------|
| FWD  | 1.00       | —      |
| RWD  | 1.00       | —      |
| AWD  | 0.95       | -5%    |
| 4WD  | 0.93       | -7%    |

### Engine Type

| Type               | Multiplier | Impact |
|--------------------|------------|--------|
| Electric           | 1.20       | +20%   |
| Hybrid             | 1.10       | +10%   |
| Diesel             | 1.05       | +5%    |
| Naturally Aspirated| 1.00       | —      |
| Turbo              | 0.95       | -5%    |
| Supercharged       | 0.90       | -10%   |

### Maintenance Quality

| Quality   | Multiplier | Impact |
|-----------|------------|--------|
| Excellent | 1.15       | +15%   |
| Good      | 1.05       | +5%    |
| Average   | 1.00       | —      |
| Poor      | 0.80       | -20%   |

### Driving Conditions

| Condition        | Multiplier | Impact |
|------------------|------------|--------|
| Highway Primary  | 1.10       | +10%   |
| Mixed            | 1.00       | —      |
| City Primary     | 0.92       | -8%    |
| Severe           | 0.80       | -20%   |

### Climate Region

| Region        | Multiplier | Impact |
|---------------|------------|--------|
| Moderate      | 1.05       | +5%    |
| Extreme Heat  | 0.92       | -8%    |
| Extreme Cold  | 0.92       | -8%    |
| Coastal Salt  | 0.90       | -10%   |
| Rust Belt     | 0.85       | -15%   |

### Accident History

| Severity | Multiplier | Impact |
|----------|------------|--------|
| None     | 1.05       | +5%    |
| Minor    | 0.95       | -5%    |
| Moderate | 0.85       | -15%   |
| Severe   | 0.70       | -30%   |

### Ownership History

| Owners          | Multiplier | Impact |
|-----------------|------------|--------|
| Single Owner    | 1.08       | +8%    |
| Two Owners      | 1.00       | —      |
| Multiple (3+)   | 0.95       | -5%    |

### Confidence Levels

| Known Factors | Confidence |
|---------------|------------|
| ≥ 5           | High       |
| 2-4           | Medium     |
| 0-1           | Low        |

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `lib/constants.ts` | Central weights, thresholds, and limits |
| `lib/scoring.ts` | Overall, reliability, longevity, and price scoring |
| `lib/safety-scoring.ts` | Safety score calculation |
| `lib/pricing.ts` | Fair market value estimation |
| `lib/lifespan-factors.ts` | Lifespan adjustment multipliers |
| `lib/red-flags.ts` | Red flag detection and penalties |
| `lib/reliability-data.ts` | Make/model reliability database |
