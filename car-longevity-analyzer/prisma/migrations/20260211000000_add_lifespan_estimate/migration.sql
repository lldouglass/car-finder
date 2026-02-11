-- CreateTable
CREATE TABLE IF NOT EXISTS "LifespanEstimate" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "expectedLifespanMiles" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifespanEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LifespanEstimate_make_model_idx" ON "LifespanEstimate"("make", "model");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LifespanEstimate_make_model_year_key" ON "LifespanEstimate"("make", "model", "year");
