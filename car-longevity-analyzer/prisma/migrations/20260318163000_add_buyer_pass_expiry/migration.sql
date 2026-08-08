-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "buyerPassExpiresAt" TIMESTAMP(3);
