import { applicationRepository } from '../repositories/application.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';

export const dashboardService = {
  async getMyDashboard(userId: string) {
    const [applications, activeCohort] = await Promise.all([
      applicationRepository.findAllByUser(userId),
      cohortRepository.findActive().catch(() => null),
    ]);

    const approvedInActiveCohort = activeCohort
      ? applications.find((a) => a.cohortId === activeCohort.id && a.status === 'approved')
      : undefined;

    return {
      applications,
      tasksTabAvailable: Boolean(approvedInActiveCohort),
    };
  },
};