-- CreateTable
CREATE TABLE "test_task_submissions" (
    "id" TEXT NOT NULL,
    "testTaskId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_task_submissions_applicationId_key" ON "test_task_submissions"("applicationId");

-- CreateIndex
CREATE INDEX "test_task_submissions_testTaskId_idx" ON "test_task_submissions"("testTaskId");

-- CreateIndex
CREATE INDEX "test_task_submissions_applicationId_idx" ON "test_task_submissions"("applicationId");

-- AddForeignKey
ALTER TABLE "test_task_submissions" ADD CONSTRAINT "test_task_submissions_testTaskId_fkey" FOREIGN KEY ("testTaskId") REFERENCES "test_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_task_submissions" ADD CONSTRAINT "test_task_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;