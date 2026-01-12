-- CreateIndex
CREATE INDEX "Cohort_isPublished_publishedAt_idx" ON "Cohort"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Cohort_creatorId_createdAt_idx" ON "Cohort"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "Cohort_deletedAt_idx" ON "Cohort"("deletedAt");
