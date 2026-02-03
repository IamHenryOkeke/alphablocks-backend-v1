-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "twitterUrl" DROP NOT NULL,
ALTER COLUMN "linkedinUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TeamMember_category_idx" ON "TeamMember"("category");
