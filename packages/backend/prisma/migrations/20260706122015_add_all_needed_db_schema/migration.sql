/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicationStart" TIMESTAMP(3) NOT NULL,
    "applicationEnd" TIMESTAMP(3) NOT NULL,
    "practiceStart" TIMESTAMP(3) NOT NULL,
    "practiceEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_fields" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_field_values" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "survey_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "roleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_roles" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_tasks" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_document_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentFio" TEXT,
    "group" TEXT,
    "directionCode" TEXT,
    "directionName" TEXT,
    "programName" TEXT,
    "specialty" TEXT,
    "practiceTopic" TEXT,
    "mainStageTasks" TEXT,
    "reviewActivities" TEXT,
    "reviewCharacteristic" TEXT,
    "reviewEmployed" TEXT,
    "reviewNextPractice" TEXT,
    "reviewEmploymentOffer" TEXT,
    "reviewSuggestions" TEXT,
    "reviewGrade" TEXT,
    "reportFileUrl" TEXT,
    "reportAdminApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_document_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "artifactLink" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "cohorts_name_idx" ON "cohorts"("name");

-- CreateIndex
CREATE INDEX "survey_fields_cohortId_idx" ON "survey_fields"("cohortId");

-- CreateIndex
CREATE INDEX "survey_fields_cohortId_order_idx" ON "survey_fields"("cohortId", "order");

-- CreateIndex
CREATE INDEX "survey_field_values_applicationId_idx" ON "survey_field_values"("applicationId");

-- CreateIndex
CREATE INDEX "survey_field_values_fieldId_idx" ON "survey_field_values"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_field_values_applicationId_fieldId_key" ON "survey_field_values"("applicationId", "fieldId");

-- CreateIndex
CREATE INDEX "applications_cohortId_idx" ON "applications"("cohortId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_cohortId_status_idx" ON "applications"("cohortId", "status");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "test_tasks_cohortId_key" ON "test_tasks"("cohortId");

-- CreateIndex
CREATE INDEX "test_tasks_publishedAt_idx" ON "test_tasks"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_document_data_applicationId_key" ON "student_document_data"("applicationId");

-- CreateIndex
CREATE INDEX "student_document_data_userId_cohortId_idx" ON "student_document_data"("userId", "cohortId");

-- CreateIndex
CREATE INDEX "student_document_data_cohortId_idx" ON "student_document_data"("cohortId");

-- CreateIndex
CREATE INDEX "student_document_data_reportAdminApproved_idx" ON "student_document_data"("reportAdminApproved");

-- CreateIndex
CREATE INDEX "task_cards_cohortId_date_idx" ON "task_cards"("cohortId", "date");

-- CreateIndex
CREATE INDEX "task_cards_userId_cohortId_idx" ON "task_cards"("userId", "cohortId");

-- CreateIndex
CREATE INDEX "task_cards_date_idx" ON "task_cards"("date");

-- CreateIndex
CREATE UNIQUE INDEX "task_cards_userId_cohortId_date_key" ON "task_cards"("userId", "cohortId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "survey_fields" ADD CONSTRAINT "survey_fields_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_field_values" ADD CONSTRAINT "survey_field_values_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_field_values" ADD CONSTRAINT "survey_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "survey_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "cohort_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_roles" ADD CONSTRAINT "cohort_roles_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_document_data" ADD CONSTRAINT "student_document_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_document_data" ADD CONSTRAINT "student_document_data_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_document_data" ADD CONSTRAINT "student_document_data_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_cards" ADD CONSTRAINT "task_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_cards" ADD CONSTRAINT "task_cards_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
