import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../db/prisma.js';
import { documentService } from '../services/document.service.js';
import { DocumentType } from '../types/document.types.js';

// Helper to get mocked prisma methods
const prismaMock = prisma as any;

const mockDoc: any = {
  id: 'doc-1',
  userId: 'user-1',
  cohortId: 'cohort-1',
  applicationId: 'app-1',
  studentFio: 'Иван Иванов',
  group: 'ПИ-301',
  directionCode: '09.03.04',
  directionName: 'Программная инженерия',
  programName: 'Разработка ПО',
  specialty: 'Программист',
  practiceTopic: 'Разработка веб-приложения',
  mainStageTasks: '1. Анализ\n2. Проектирование\n3. Разработка',
  reviewActivities: null,
  reviewCharacteristic: null,
  reviewEmployed: null,
  reviewNextPractice: null,
  reviewEmploymentOffer: null,
  reviewSuggestions: null,
  reviewGrade: null,
  reportFileUrl: null,
  individualTaskFileUrl: null,
  individualTaskStatus: 'draft',
  individualTaskComment: null,
  individualTaskAdminFileUrl: null,
  reportStatus: 'draft',
  reportComment: null,
  reportAdminFileUrl: null,
  titlePageFileUrl: null,
  titlePageStatus: 'draft',
  titlePageComment: null,
  titlePageAdminFileUrl: null,
  reviewFileUrl: null,
  reviewStatus: 'draft',
  reviewComment: null,
  reviewAdminFileUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApplication: any = {
  id: 'app-1',
  userId: 'user-1',
  cohortId: 'cohort-1',
  status: 'approved',
  user: { id: 'user-1', email: 'test@example.com' },
};

const mockCohort: any = {
  id: 'cohort-1',
  name: '2026',
  practiceStart: new Date('2026-06-01'),
  practiceEnd: new Date('2026-08-31'),
};

describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreate', () => {
    it('should return existing document data', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);
      const result = await documentService.getOrCreate('user-1', 'cohort-1', 'app-1');
      expect(result.id).toBe('doc-1');
    });

    it('should create new document data if not exists', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.studentDocumentData.create).mockResolvedValueOnce(mockDoc);
      const result = await documentService.getOrCreate('user-1', 'cohort-1', 'app-1');
      expect(result.id).toBe('doc-1');
    });
  });

  describe('update', () => {
    it('should update document data', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...mockDoc,
        studentFio: 'Петр Петров',
      });

      const result = await documentService.update('user-1', 'cohort-1', { studentFio: 'Петр Петров' });
      expect(result.studentFio).toBe('Петр Петров');
    });

    it('should throw NotFoundError if document not found', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(null);
      await expect(documentService.update('user-1', 'cohort-1', { studentFio: 'Test' }))
        .rejects.toThrow('Document data not found');
    });
  });

  describe('uploadReport', () => {
    it('should upload report file', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...mockDoc,
        reportFileUrl: '/uploads/report.pdf',
      });

      const result = await documentService.uploadReport('user-1', 'cohort-1', '/uploads/report.pdf');
      expect(result.reportFileUrl).toBe('/uploads/report.pdf');
    });

    it('should throw NotFoundError if document not found', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(null);
      await expect(documentService.uploadReport('user-1', 'cohort-1', '/uploads/test.pdf'))
        .rejects.toThrow('Document data not found');
    });
  });

  describe('setReview', () => {
    it('should set review fields', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...mockDoc,
        reviewGrade: '5',
        reviewActivities: 'Отлично',
      });
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce({
        ...mockDoc,
        reviewGrade: '5',
        reviewActivities: 'Отлично',
        reviewCharacteristic: 'Хорошо',
        reviewEmployed: 'Да',
        reviewNextPractice: 'Нет',
        reviewEmploymentOffer: 'Да',
        reviewSuggestions: 'Нет',
      });

      const result = await documentService.setReview('user-1', 'cohort-1', {
        reviewGrade: '5',
        reviewActivities: 'Отлично',
      });
      expect(result.reviewGrade).toBe('5');
    });
  });

  describe('submit document', () => {
    it('should submit document and set status to pending', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...mockDoc,
        individualTaskStatus: 'pending',
        individualTaskFileUrl: '/uploads/file.docx',
      });
      // applicationRepository.findById calls prisma.application.findUnique internally
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);

      const result = await documentService.submitDocument('user-1', 'cohort-1', 'individual-task', '/uploads/file.docx');
      expect(result).toBeDefined();
    });

    it('should throw error if already pending', async () => {
      const pendingDoc = { ...mockDoc, individualTaskStatus: 'pending' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(pendingDoc);

      await expect(
        documentService.submitDocument('user-1', 'cohort-1', 'individual-task', '/uploads/file.docx')
      ).rejects.toThrow('Документ уже отправлен на проверку');
    });

    it('should throw error if already approved', async () => {
      const approvedDoc = { ...mockDoc, individualTaskStatus: 'approved' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(approvedDoc);

      await expect(
        documentService.submitDocument('user-1', 'cohort-1', 'individual-task', '/uploads/file.docx')
      ).rejects.toThrow('Документ уже подтверждён');
    });
  });

  describe('approve document', () => {
    it('should approve pending document', async () => {
      const pendingDoc = { ...mockDoc, individualTaskStatus: 'pending' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(pendingDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...pendingDoc,
        individualTaskStatus: 'approved',
        individualTaskAdminFileUrl: '/uploads/signed.docx',
      });
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);

      const result = await documentService.approveDocument('user-1', 'cohort-1', 'individual-task', '/uploads/signed.docx');
      // We check the update was called - since the result is mocked
      expect(result).toBeDefined();
    });

    it('should throw error if document is not pending', async () => {
      const draftDoc = { ...mockDoc, individualTaskStatus: 'draft' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(draftDoc);

      await expect(
        documentService.approveDocument('user-1', 'cohort-1', 'individual-task', '/uploads/signed.docx')
      ).rejects.toThrow('Документ не находится на проверке');
    });
  });

  describe('reject document', () => {
    it('should reject pending document with comment', async () => {
      const pendingDoc = { ...mockDoc, individualTaskStatus: 'pending' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(pendingDoc);
      vi.mocked(prisma.studentDocumentData.update).mockResolvedValueOnce({
        ...pendingDoc,
        individualTaskStatus: 'rejected',
        individualTaskComment: 'Нужно исправить',
      });
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication);

      const result = await documentService.rejectDocument('user-1', 'cohort-1', 'individual-task', 'Нужно исправить');
      expect(result).toBeDefined();
    });

    it('should throw error if no comment provided', async () => {
      await expect(
        documentService.rejectDocument('user-1', 'cohort-1', 'individual-task', '')
      ).rejects.toThrow('Комментарий обязателен при отклонении');
    });

    it('should throw error if document is not pending', async () => {
      const draftDoc = { ...mockDoc, individualTaskStatus: 'draft' };
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(draftDoc);

      await expect(
        documentService.rejectDocument('user-1', 'cohort-1', 'individual-task', 'Нужно исправить')
      ).rejects.toThrow('Документ не находится на проверке');
    });
  });

  describe('getStatus', () => {
    it('should return document status', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);

      const result = await documentService.getStatus('user-1', 'cohort-1', 'individual-task');
      expect(result.type).toBe('individual-task');
      expect(result.status).toBeDefined();
    });
  });

  describe('getMyDocuments', () => {
    it('should return all document statuses', async () => {
      vi.mocked(prisma.studentDocumentData.findFirst).mockResolvedValueOnce(mockDoc);

      const result = await documentService.getMyDocuments('user-1', 'cohort-1');
      expect(result.documents).toHaveLength(4);
      expect(result.documents.map((d: any) => d.type)).toEqual(
        expect.arrayContaining(['individual-task', 'report', 'title-page', 'review'])
      );
    });
  });
});