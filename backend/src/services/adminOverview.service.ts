import { applicationRepository } from '../repositories/application.repository.js';
import { studentDocumentDataRepository } from '../repositories/studentDocumentData.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { taskCardRepository } from '../repositories/taskCard.repository.js';
import { NotFoundError } from '../errors/index.js';

const INDIVIDUAL_FIELDS = ['studentFio', 'group', 'directionCode', 'directionName', 'programName', 'practiceTopic', 'mainStageTasks'];
const TITLE_FIELDS = ['studentFio', 'group', 'specialty', 'practiceTopic'];
const REVIEW_FIELDS = ['reviewActivities', 'reviewCharacteristic', 'reviewEmployed', 'reviewNextPractice', 'reviewEmploymentOffer', 'reviewSuggestions', 'reviewGrade'];

function checkFieldsFilled(doc: Record<string, unknown> | null, fields: string[]): boolean {
  if (!doc) return false;
  return fields.every((key) => {
    const value = doc[key];
    return value !== null && value !== undefined && value !== '';
  });
}

function getUserNameFromApplication(application: any): string {
  // Extract from fieldValues where field label is "ФИО"
  const fioField = application.fieldValues?.find(
    (fv: any) => fv.field?.label?.toLowerCase().includes('фио')
  );
  if (fioField?.value) {
    return fioField.value;
  }

  // Last resort: use email
  return application.user?.email || '';
}

export const adminOverviewService = {
  async getDocumentsOverview(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    const applications = await applicationRepository.findAllByCohort(cohortId);

    const approvedApplications = applications.filter((a) => a.status === 'approved');

    const overview = await Promise.all(
      approvedApplications.map(async (application) => {
        let doc = await studentDocumentDataRepository.findByUserAndCohort(
          application.user.id,
          cohortId,
        );

        // If no document data exists yet, treat as empty
        const docRecord = (doc ? doc : null) as Record<string, unknown> | null;
        const userName = getUserNameFromApplication(application);
        const reportFileUrl = docRecord ? (docRecord.reportFileUrl as string) || null : null;

        return {
          userId: application.user.id,
          userEmail: application.user.email,
          userName,
          roleId: application.roleId,
          status: application.status,
          docExists: !!doc,
          reportFileUrl,
          individualTaskFieldsFilled: checkFieldsFilled(docRecord, INDIVIDUAL_FIELDS),
          titlePageFieldsFilled: checkFieldsFilled(docRecord, TITLE_FIELDS),
          reviewFieldsFilled: checkFieldsFilled(docRecord, REVIEW_FIELDS),
          reportUploaded: !!reportFileUrl,
          reportStatus: docRecord ? (docRecord.reportStatus as string) || 'draft' : 'draft',
          individualTaskStatus: docRecord ? (docRecord.individualTaskStatus as string) || 'draft' : 'draft',
          titlePageStatus: docRecord ? (docRecord.titlePageStatus as string) || 'draft' : 'draft',
          reviewStatus: docRecord ? (docRecord.reviewStatus as string) || 'draft' : 'draft',
          // Overall readiness per document type
          individualTaskReady: docRecord
            ? checkFieldsFilled(docRecord, INDIVIDUAL_FIELDS) && application.status === 'approved'
            : false,
          reviewReady: checkFieldsFilled(docRecord, REVIEW_FIELDS),
          titlePageReady: docRecord
            ? checkFieldsFilled(docRecord, TITLE_FIELDS) &&
              !!docRecord.reportFileUrl
            : false,
        };
      }),
    );

    return {
      cohortId,
      cohortName: cohort.name,
      totalApproved: approvedApplications.length,
      students: overview,
    };
  },

  async getTasksOverview(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    // Get all task cards for the entire practice period
    const from = cohort.practiceStart;
    const to = cohort.practiceEnd;

    const taskCards = await taskCardRepository.findByCohortAndRange(cohortId, from, to);

    // Group by user
    const byUser: Record<string, { userId: string; userEmail: string; count: number; tasks: any[] }> = {};
    for (const card of taskCards) {
      const key = card.user.id;
      if (!byUser[key]) {
        byUser[key] = { userId: key, userEmail: card.user.email, count: 0, tasks: [] };
      }
      byUser[key].count++;
      byUser[key].tasks.push({
        id: card.id,
        date: card.date.toISOString().split('T')[0],
        title: card.title,
        description: card.description,
        artifactLink: card.artifactLink,
      });
    }

    return {
      cohortId,
      cohortName: cohort.name,
      totalStudentsWithTasks: Object.keys(byUser).length,
      students: Object.values(byUser),
    };
  },
};