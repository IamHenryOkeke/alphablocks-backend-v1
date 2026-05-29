/*
  Warnings:

  - You are about to drop the column `linkedinUrl` on the `TeamMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "linkedinUrl",
ADD COLUMN     "linkedInUrl" TEXT;
