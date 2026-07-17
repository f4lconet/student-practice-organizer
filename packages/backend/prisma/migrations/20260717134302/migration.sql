/*
  Warnings:

  - You are about to drop the column `reportAdminApproved` on the `student_document_data` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "student_document_data_reportAdminApproved_idx";

-- AlterTable
ALTER TABLE "student_document_data" DROP COLUMN "reportAdminApproved",
ADD COLUMN     "individualTaskAdminFileUrl" TEXT,
ADD COLUMN     "individualTaskComment" TEXT,
ADD COLUMN     "individualTaskFileUrl" TEXT,
ADD COLUMN     "individualTaskStatus" TEXT,
ADD COLUMN     "reportAdminFileUrl" TEXT,
ADD COLUMN     "reportComment" TEXT,
ADD COLUMN     "reportStatus" TEXT,
ADD COLUMN     "reviewAdminFileUrl" TEXT,
ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewFileUrl" TEXT,
ADD COLUMN     "reviewStatus" TEXT,
ADD COLUMN     "titlePageAdminFileUrl" TEXT,
ADD COLUMN     "titlePageComment" TEXT,
ADD COLUMN     "titlePageFileUrl" TEXT,
ADD COLUMN     "titlePageStatus" TEXT;
