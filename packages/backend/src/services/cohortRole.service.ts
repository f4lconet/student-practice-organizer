import { cohortRoleRepository } from '../repositories/cohortRole.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { ValidationError, NotFoundError, ConflictError } from '../errors/index.js';

export const cohortRoleService = {
  async create(cohortId: string, name: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) {
      throw new NotFoundError('Когорта не найдена');
    }

    const existingRole = await cohortRoleRepository.findByName(cohortId, name);
    if (existingRole) {
      throw new ConflictError(`Роль "${name}" уже существует в этой когорте`);
    }

    return cohortRoleRepository.create(cohortId, name);
  },

  async findByCohort(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) {
      throw new NotFoundError('Cohort not found');
    }

    return cohortRoleRepository.findByCohort(cohortId);
  },

  async findById(id: string) {
    const role = await cohortRoleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  },

  async delete(id: string) {
    const role = await cohortRoleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return cohortRoleRepository.delete(id);
  },

  async deleteMany(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) {
      throw new NotFoundError('Cohort not found');
    }

    return cohortRoleRepository.deleteMany(cohortId);
  },
};