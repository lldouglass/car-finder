-- CreateTable
CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key", "windowStart")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimitEntry_expiresAt_idx" ON "RateLimitEntry"("expiresAt");
