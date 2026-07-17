import { surveyFieldRepository } from '../repositories/surveyField.repository.js';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { NotFoundError, ValidationError } from '../errors/index.js';

const VALID_TYPES = ['text', 'select'];

export const surveyService = {
  async create(cohortId: string, data: { label: string; type: string; options?: string; order: number; isRequired?: boolean }) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');

    if (!VALID_TYPES.includes(data.type)) {
      throw new ValidationError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (data.type === 'select' && !data.options) {
      throw new ValidationError('options is required for select fields');
    }

    return surveyFieldRepository.create({ cohortId, ...data });
  },

  async findByCohort(cohortId: string) {
    const cohort = await cohortRepository.findById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort not found');
    return surveyFieldRepository.findByCohort(cohortId);
  },

  async update(id: string, data: Partial<{ label: string; type: string; options: string; order: number; isRequired: boolean }>) {
    const field = await surveyFieldRepository.findById(id);
    if (!field) throw new NotFoundError('Survey field not found');

    if (data.type && !VALID_TYPES.includes(data.type)) {
      throw new ValidationError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    return surveyFieldRepository.update(id, data);
  },

  async delete(id: string) {
    const field = await surveyFieldRepository.findById(id);
    if (!field) throw new NotFoundError('Survey field not found');
    return surveyFieldRepository.delete(id);
  },
};