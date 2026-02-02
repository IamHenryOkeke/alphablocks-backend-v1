-- CreateEnum
CREATE TYPE "TeamCategory" AS ENUM ('FOUNDER', 'DESIGN_AND_PRODUCT', 'COMMUNITY_MANAGEMENT', 'ENGINEERING', 'CONTENT_CREATION', 'OTHERS');

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TeamCategory" NOT NULL,
    "twitterUrl" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
