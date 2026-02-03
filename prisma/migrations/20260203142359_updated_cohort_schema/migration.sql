/*
  Warnings:

  - You are about to drop the column `whatsappGroup` on the `Cohort` table. All the data in the column will be lost.
  - Added the required column `whatsappGroupUrl` to the `Cohort` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cohort" DROP COLUMN "whatsappGroup",
ADD COLUMN     "whatsappGroupUrl" TEXT NOT NULL;
