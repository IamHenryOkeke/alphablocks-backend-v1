/*
  Warnings:

  - A unique constraint covering the columns `[cohortId,userId]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Participant_cohortId_userId_key" ON "Participant"("cohortId", "userId");
