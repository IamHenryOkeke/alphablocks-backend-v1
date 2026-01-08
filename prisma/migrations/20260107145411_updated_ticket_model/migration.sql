/*
  Warnings:

  - You are about to drop the column `paidStatus` on the `CohortTicket` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "CohortTicket" DROP COLUMN "paidStatus",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
