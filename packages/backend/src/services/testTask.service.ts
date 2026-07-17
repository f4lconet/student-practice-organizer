import { testTaskRepository } from '../repositories/testTask.repository.js';
import { applicationRepository } from '../repositories/application.repository.js';
import { mailService } from '../lib/mail.service.js';
import { NotFoundError, ForbiddenError } from '../errors/index.js';

export const testTaskService = {
  async upsert(cohortId: string, content: string) {
    return testTaskRepository.upsert(cohortId, content);
  },

  async publish(cohortId: string) {
    const testTask = await testTaskRepository.publish(cohortId);

    const applications = await applicationRepository.findAllByCohort(cohortId);
    for (const application of applications) {
      try {
        const email = mailService.createTestTaskPublishedEmail(application.user);
        await mailService.sendEmail(email);
      } catch (error) {
        console.error('Не удалось отправить письмо о публикации задания:', error);
      }
    }

    return testTask;
  },

  async getForApplication(applicationId: string, userId: string) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    if (application.userId !== userId) throw new ForbiddenError('Access denied');

    const testTask = await testTaskRepository.findByCohort(application.cohortId);
    if (!testTask || !testTask.publishedAt) {
      return { published: false };
    }

    return { published: true, content: testTask.content };
  },
};