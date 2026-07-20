import { testTaskSubmissionRepository } from '../repositories/testTaskSubmission.repository.js';
import { testTaskRepository } from '../repositories/testTask.repository.js';
import { applicationRepository } from '../repositories/application.repository.js';
import { NotFoundError, ForbiddenError } from '../errors/index.js';

export const testTaskSubmissionService = {
  async submit(applicationId: string, userId: string, content: string) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    if (application.userId !== userId) throw new ForbiddenError('Access denied');

    const testTask = await testTaskRepository.findByCohort(application.cohortId);
    if (!testTask || !testTask.publishedAt) {
      throw new ForbiddenError('Test task is not published yet');
    }

    return testTaskSubmissionRepository.upsert(testTask.id, applicationId, content);
  },

  async getMySubmission(applicationId: string, userId: string) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    if (application.userId !== userId) throw new ForbiddenError('Access denied');

    const submission = await testTaskSubmissionRepository.findByApplication(applicationId);
    return submission;
  },

  async getSubmissionsForCohort(cohortId: string) {
    const testTask = await testTaskRepository.findByCohort(cohortId);
    if (!testTask) throw new NotFoundError('Test task not found for this cohort');

    return testTaskSubmissionRepository.findByTestTask(testTask.id);
  },
};