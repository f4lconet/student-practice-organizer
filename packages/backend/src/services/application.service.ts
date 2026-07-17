import { applicationRepository } from '../repositories/application.repository.js';
import { cohortRoleRepository } from '../repositories/cohortRole.repository.js';
import { mailService } from '../lib/mail.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';

export const applicationService = {
  async submit(userId: string, cohortId: string, fieldValues: { fieldId: string; value: string }[]) {
    const existing = await applicationRepository.findByUserAndCohort(userId, cohortId);
    if (existing) {
      throw new ConflictError('Заявка в эту когорту уже подана');
    }

    return applicationRepository.create({ userId, cohortId, fieldValues });
  },

  async getPrefillData(userId: string) {
    const latest = await applicationRepository.findLatestByUser(userId);
    if (!latest) return {};

    const byLabel: Record<string, string> = {};
    for (const fv of latest.fieldValues) {
      byLabel[fv.field.label] = fv.value;
    }
    return byLabel;
  },

  async findAllByUser(userId: string) {
    return applicationRepository.findAllByUser(userId);
  },

  async findAllByCohort(cohortId: string) {
    return applicationRepository.findAllByCohort(cohortId);
  },

  async approve(applicationId: string, roleId: string) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');

    const role = await cohortRoleRepository.findById(roleId);
    if (!role || role.cohortId !== application.cohortId) {
      throw new ValidationError('roleId does not belong to this cohort');
    }

    const updated = await applicationRepository.updateStatus(applicationId, 'approved', { roleId });

    try {
      await mailService.sendEmail(mailService.createApplicationApprovedEmail(updated.user));
    } catch (error) {
      console.error('Не удалось отправить письмо об одобрении заявки:', error);
    }

    return updated;
  },

  async reject(applicationId: string, reviewComment?: string) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');

    const updated = await applicationRepository.updateStatus(applicationId, 'rejected', { reviewComment });

    try {
      await mailService.sendEmail(mailService.createApplicationRejectedEmail(updated.user, reviewComment));
    } catch (error) {
      console.error('Не удалось отправить письмо об отклонении заявки:', error);
    }

    return updated;
  },
};