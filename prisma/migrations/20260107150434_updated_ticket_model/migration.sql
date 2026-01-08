/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `CohortTicket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `CohortTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CohortTicket" ADD COLUMN     "authorizationUrl" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "initializedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CohortTicket_idempotencyKey_key" ON "CohortTicket"("idempotencyKey");
