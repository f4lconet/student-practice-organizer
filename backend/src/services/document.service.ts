import { studentDocumentDataRepository } from '../repositories/studentDocumentData.repository.js';
import { applicationRepository } from '../repositories/application.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { docxService } from './docx.service.js';
import { mailService } from '../lib/mail.service.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/index.js';
import { StudentDocumentData } from '../generated/prisma/client.js';
import { DocumentType, DocumentStatus } from '../types/document.types.js';

const REQUIRED_FIELDS: Record<'individual' | 'review' | 'title', string[]> = {
  individual: ['studentFio', 'group', 'directionCode', 'directionName', 'programName', 'practiceTopic', 'mainStageTasks'],
  review: ['studentFio', 'group', 'reviewActivities', 'reviewCharacteristic', 'reviewEmployed', 'reviewNextPractice', 'reviewEmploymentOffer', 'reviewSuggestions', 'reviewGrade'],
  title: ['studentFio', 'group', 'specialty', 'practiceTopic'],
};

const TEMPLATE_MAP: Record<string, string> = {
  'individual-task': 'individual-task.docx',
  'title-page': 'title-page.docx',
  'review': 'review.docx',
};

// Map document type to the Prisma field prefix
const TYPE_FIELD_PREFIX: Record<DocumentType, string> = {
  'individual-task': 'individualTask',
  'report': 'report',
  'title-page': 'titlePage',
  'review': 'review',
};

function checkEligibility(doc: StudentDocumentData, type: 'individual' | 'review' | 'title', applicationStatus: string) {
  if (type === 'individual' && applicationStatus !== 'approved') {
    throw new ValidationError('Заявка ещё не одобрена');
  }
  if (type === 'title' && !doc.reportFileUrl) {
    throw new ValidationError('Отчёт не загружен');
  }

  const missing = REQUIRED_FIELDS[type].filter((key) => !(doc as any)[key]);
  if (missing.length > 0) {
    throw new ValidationError(`Не заполнены поля: ${missing.join(', ')}`);
  }
}

export const documentService = {
  async getOrCreate(userId: string, cohortId: string, applicationId: string) {
    return studentDocumentDataRepository.findOrCreate(userId, cohortId, applicationId);
  },

  async update(userId: string, cohortId: string, data: Partial<StudentDocumentData>) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    return studentDocumentDataRepository.update(doc.id, data);
  },

  async uploadReport(userId: string, cohortId: string, fileUrl: string) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    return studentDocumentDataRepository.setReportFile(doc.id, fileUrl);
  },

  async generate(userId: string, cohortId: string, type: string) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    // Get application to check status
    const application = await applicationRepository.findById(doc.applicationId);
    if (!application) throw new NotFoundError('Application not found');

    // Get cohort for dates
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const templateName = TEMPLATE_MAP[type];
    if (!templateName) throw new ValidationError(`Unknown document type: ${type}`);

    // Map URL type keys to required-fields keys
    const requiredKey = type === 'individual-task' ? 'individual' : type === 'title-page' ? 'title' : type;
    checkEligibility(doc, requiredKey as 'individual' | 'review' | 'title', application.status);

    // Build data for template
    const templateData: Record<string, unknown> = {
      studentFio: doc.studentFio,
      group: doc.group,
      directionCode: doc.directionCode,
      directionName: doc.directionName,
      programName: doc.programName,
      specialty: doc.specialty,
      practiceTopic: doc.practiceTopic,
      mainStageTasks: doc.mainStageTasks,
      reviewActivities: doc.reviewActivities,
      reviewCharacteristic: doc.reviewCharacteristic,
      reviewEmployed: doc.reviewEmployed,
      reviewNextPractice: doc.reviewNextPractice,
      reviewEmploymentOffer: doc.reviewEmploymentOffer,
      reviewSuggestions: doc.reviewSuggestions,
      reviewGrade: doc.reviewGrade,
      practiceStart: cohort.practiceStart.toISOString().split('T')[0],
      practiceEnd: cohort.practiceEnd.toISOString().split('T')[0],
      // Вычисляемые даты для шаблона
      practiceStartPlus7: new Date(cohort.practiceStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      practiceStartPlus23: new Date(cohort.practiceStart.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      practiceEndMinus3: new Date(cohort.practiceEnd.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    return docxService.generate(templateName, templateData);
  },

  async setReview(userId: string, cohortId: string, data: {
    reviewActivities?: string;
    reviewCharacteristic?: string;
    reviewEmployed?: string;
    reviewNextPractice?: string;
    reviewEmploymentOffer?: string;
    reviewSuggestions?: string;
    reviewGrade?: string;
  }) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const updated = await studentDocumentDataRepository.setReviewFields(doc.id, data);

    // Check if all review fields are filled -> send notification
    const allReviewFields = REQUIRED_FIELDS.review;
    const updatedDoc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    const allFilled = allReviewFields.every((key) => (updatedDoc as any)[key]);

    if (allFilled) {
      try {
        const application = await applicationRepository.findById(doc.applicationId);
        if (application) {
          await mailService.sendEmail(mailService.createDocumentReadyEmail(application.user, 'review'));
        }
      } catch (error) {
        console.error('Не удалось отправить уведомление о готовности отзыва:', error);
      }
    }

    return updated;
  },

  // ======================
  // NEW WORKFLOW ENDPOINTS
  // ======================

  async submitDocument(userId: string, cohortId: string, type: DocumentType, fileUrl: string) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const fieldPrefix = TYPE_FIELD_PREFIX[type];
    const currentStatus = (doc as any)[`${fieldPrefix}Status`] as string | null;

    // Cannot submit if already pending
    if (currentStatus === 'pending') {
      throw new ValidationError('Документ уже отправлен на проверку');
    }

    // Cannot submit if already approved
    if (currentStatus === 'approved') {
      throw new ValidationError('Документ уже подтверждён');
    }

    // If resubmitting after rejection, set status to revised
    let status: string = 'pending';
    if (currentStatus === 'rejected') {
      status = 'revised';
    }

    const updated = await studentDocumentDataRepository.submitDocument(doc.id, fieldPrefix, fileUrl);

    // Actually set the correct status (revised vs pending) - we do a second update
    if (status === 'revised') {
      const statusField = `${fieldPrefix}Status` as keyof StudentDocumentData;
      await studentDocumentDataRepository.update(doc.id, { [statusField]: 'revised' } as any);
      // Refetch to get correct status
      const revisedDoc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
      return revisedDoc;
    }

    // Send notifications
    try {
      const application = await applicationRepository.findById(doc.applicationId);
      if (application) {
        await mailService.sendEmail(mailService.createDocumentSubmittedEmail(application.user, type));
      }
    } catch (error) {
      console.error(`Не удалось отправить уведомление о отправке ${type}:`, error);
    }

    return updated;
  },

  async approveDocument(userId: string, cohortId: string, type: DocumentType, adminFileUrl?: string, comment?: string) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const fieldPrefix = TYPE_FIELD_PREFIX[type];
    const currentStatus = (doc as any)[`${fieldPrefix}Status`] as string | null;

    // Can only approve documents that are pending or revised
    if (currentStatus !== 'pending' && currentStatus !== 'revised') {
      throw new ValidationError('Документ не находится на проверке');
    }

    const updated = await studentDocumentDataRepository.approveDocument(doc.id, fieldPrefix, adminFileUrl, comment);

    // Send notification to student
    try {
      const application = await applicationRepository.findById(doc.applicationId);
      if (application) {
        await mailService.sendEmail(mailService.createDocumentReadyEmail(application.user, type));
      }
    } catch (error) {
      console.error(`Не удалось отправить уведомление об одобрении ${type}:`, error);
    }

    return updated;
  },

  async rejectDocument(userId: string, cohortId: string, type: DocumentType, comment: string) {
    if (!comment || comment.trim().length === 0) {
      throw new ValidationError('Комментарий обязателен при отклонении');
    }

    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const fieldPrefix = TYPE_FIELD_PREFIX[type];
    const currentStatus = (doc as any)[`${fieldPrefix}Status`] as string | null;

    // Can only reject documents that are pending or revised
    if (currentStatus !== 'pending' && currentStatus !== 'revised') {
      throw new ValidationError('Документ не находится на проверке');
    }

    const updated = await studentDocumentDataRepository.rejectDocument(doc.id, fieldPrefix, comment);

    // Send notification to student
    try {
      const application = await applicationRepository.findById(doc.applicationId);
      if (application) {
        await mailService.sendEmail(mailService.createDocumentRejectedEmail(application.user, type, comment));
      }
    } catch (error) {
      console.error(`Не удалось отправить уведомление об отклонении ${type}:`, error);
    }

    return updated;
  },

  async getStatus(userId: string, cohortId: string, type: DocumentType) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const fieldPrefix = TYPE_FIELD_PREFIX[type];
    const statusData = await studentDocumentDataRepository.getDocumentStatus(doc, fieldPrefix);
    
    const status = statusData.status as DocumentStatus;

    return {
      type,
      status,
      comment: statusData.comment,
      fileUrl: statusData.fileUrl,
      adminFileUrl: statusData.adminFileUrl,
      canGenerate: status === 'draft' || status === 'rejected',
      canSubmit: status === 'draft' || status === 'rejected',
      canResubmit: status === 'rejected',
    };
  },

  async getMyDocuments(userId: string, cohortId: string) {
    const doc = await studentDocumentDataRepository.findByUserAndCohort(userId, cohortId);
    if (!doc) throw new NotFoundError('Document data not found');

    const types: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
    const statuses = await Promise.all(
      types.map(async (type) => {
        const fieldPrefix = TYPE_FIELD_PREFIX[type];
        const statusData = await studentDocumentDataRepository.getDocumentStatus(doc, fieldPrefix);
        const status = statusData.status as DocumentStatus;
        return {
          type,
          status,
          comment: statusData.comment,
          fileUrl: statusData.fileUrl,
          adminFileUrl: statusData.adminFileUrl,
          canGenerate: status === 'draft' || status === 'rejected',
          canSubmit: status === 'draft' || status === 'rejected',
          canResubmit: status === 'rejected',
        };
      })
    );

    return {
      userId: doc.userId,
      cohortId: doc.cohortId,
      studentFio: doc.studentFio,
      group: doc.group,
      documents: statuses,
    };
  },
};