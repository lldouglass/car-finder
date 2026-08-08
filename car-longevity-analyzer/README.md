# Car Longevity Analyzer

A tool to analyze and score the potential longevity of vehicles based on various data points.

## Setup
1. Copy `.env.example` to `.env`
2. Install dependencies
3. Run the application

## Database migrations
The build script runs `prisma generate` only — it never applies migrations. Apply
them yourself against the production database before (or right after) a deploy
that adds one:

```bash
npx prisma migrate deploy
```

Pending: `20260808120000_add_rate_limit_entry`, which backs the durable rate
limiter. Until it is applied, `checkRateLimit` falls back to per-instance
in-memory limits and logs `durable rate limit store unavailable` — the site keeps
working, but the limits are only enforced per lambda instance.

Set `RATE_LIMIT_DURABLE=off` to force that in-memory behaviour deliberately.

## Features
- NHTSA API Integration
- Vehicle Scoring Engine
- Red Flag Detection
