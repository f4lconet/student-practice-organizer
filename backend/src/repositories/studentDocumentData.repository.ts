import prisma from '../db/prisma.js';
import { StudentDocumentData } from '../generated/prisma/client.js';

export const studentDocumentDataRepository = {
  async findOrCreate(userId: string, cohortId: string, applicationId: string): Promise<StudentDocumentData> {
    const existing = await prisma.studentDocumentData.findFirst({
      where: { userId, cohortId },
    });

    if (existing) return existing;

    return prisma.studentDocumentData.create({
      data: { userId, cohortId, applicationId },
    });
  },

  async findByUserAndCohort(userId: string, cohortId: string): Promise<StudentDocumentData | null> {
    return prisma.studentDocumentData.findFirst({
      where: { userId, cohortId },
    });
  },

  async update(id: string, data: Partial<StudentDocumentData>): Promise<StudentDocumentData> {
    return prisma.studentDocumentData.update({
      where: { id },
      data,
    });
  },

  async setReportFile(id: string, fileUrl: string): Promise<StudentDocumentData> {
    return prisma.studentDocumentData.update({
      where: { id },
      data: { reportFileUrl: fileUrl },
    });
  },

  async setReviewFields(id: string, data: {
    reviewActivities?: string;
    reviewCharacteristic?: string;
    reviewEmployed?: string;
    reviewNextPractice?: string;
    reviewEmploymentOffer?: string;
    reviewSuggestions?: string;
    reviewGrade?: string;
  }): Promise<StudentDocumentData> {
    return prisma.studentDocumentData.update({
      where: { id },
      data,
    });
  },

  // === NEW: Document workflow methods ===

  async submitDocument(docId: string, typeField: string, fileUrl: string): Promise<StudentDocumentData> {
    const statusField = `${typeField}Status` as keyof StudentDocumentData;
    const fileUrlField = `${typeField}FileUrl` as keyof StudentDocumentData;
    
    const updateData: any = {};
    // If previously rejected, status becomes "revised", otherwise "pending"
    // We handle this logic in the service layer, here we just set status to pending
    updateData[statusField] = 'pending';
    updateData[fileUrlField] = fileUrl;

    return prisma.studentDocumentData.update({
      where: { id: docId },
      data: updateData,
    });
  },

  async approveDocument(docId: string, typeField: string, adminFileUrl?: string, comment?: string): Promise<StudentDocumentData> {
    const statusField = `${typeField}Status` as keyof StudentDocumentData;
    const commentField = `${typeField}Comment` as keyof StudentDocumentData;
    const adminFileUrlField = `${typeField}AdminFileUrl` as keyof StudentDocumentData;

    const updateData: any = {};
    updateData[statusField] = 'approved';
    if (adminFileUrl !== undefined) {
      updateData[adminFileUrlField] = adminFileUrl;
    }
    if (comment !== undefined) {
      updateData[commentField] = comment;
    }

    return prisma.studentDocumentData.update({
      where: { id: docId },
      data: updateData,
    });
  },

  async rejectDocument(docId: string, typeField: string, comment: string): Promise<StudentDocumentData> {
    const statusField = `${typeField}Status` as keyof StudentDocumentData;
    const commentField = `${typeField}Comment` as keyof StudentDocumentData;

    const updateData: any = {};
    updateData[statusField] = 'rejected';
    updateData[commentField] = comment;

    return prisma.studentDocumentData.update({
      where: { id: docId },
      data: updateData,
    });
  },

  async findByCohort(cohortId: string): Promise<StudentDocumentData[]> {
    return prisma.studentDocumentData.findMany({
      where: { cohortId },
    });
  },

  async getDocumentStatus(doc: StudentDocumentData, typeField: string) {
    const statusField = `${typeField}Status` as keyof StudentDocumentData;
    const commentField = `${typeField}Comment` as keyof StudentDocumentData;
    const fileUrlField = `${typeField}FileUrl` as keyof StudentDocumentData;
    const adminFileUrlField = `${typeField}AdminFileUrl` as keyof StudentDocumentData;

    return {
      status: (doc[statusField] as string) || 'draft',
      comment: (doc[commentField] as string) || null,
      fileUrl: (doc[fileUrlField] as string) || null,
      adminFileUrl: (doc[adminFileUrlField] as string) || null,
    };
  },
};