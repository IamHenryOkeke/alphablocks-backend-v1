/*
  Warnings:

  - Added the required column `whatsappGroup` to the `Cohort` table without a default value. This is not possible if the table is not empty.
  - Made the column `cohortId` on table `CohortTicket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CohortTicket" DROP CONSTRAINT "CohortTicket_cohortId_fkey";

-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "whatsappGroup" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CohortTicket" ALTER COLUMN "cohortId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CohortTicket" ADD CONSTRAINT "CohortTicket_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
