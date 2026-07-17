// src/services/cohort.service.ts
import { cohortRepository } from '../repositories/cohort.repository.js';
import { surveyFieldRepository } from '../repositories/surveyField.repository.js';
import { ValidationError, NotFoundError, ConflictError } from '../errors/index.js';

export const cohortService = {
  async create(data: {
    name: string;
    applicationStart: Date | string;
    applicationEnd: Date | string;
    practiceStart: Date | string;
    practiceEnd: Date | string;
  }) {
    const applicationStart = new Date(data.applicationStart);
    const applicationEnd = new Date(data.applicationEnd);
    const practiceStart = new Date(data.practiceStart);
    const practiceEnd = new Date(data.practiceEnd);

    if (applicationStart >= applicationEnd) {
      throw new ValidationError('The application submission deadline must be later than the start date.');
    }

    if (practiceStart >= practiceEnd) {
      throw new ValidationError('The internship end date must be later than the start date.');
    }

    if (applicationEnd > practiceStart) {
      throw new ValidationError('The application deadline must be prior to the start of the internship.');
    }

    const existingCohort = await cohortRepository.findByName(data.name);
    if (existingCohort) {
      throw new ConflictError(`A cohort named "${data.name}" already exists.`);
    }

    const cohort = await cohortRepository.create({
      name: data.name,
      applicationStart,
      applicationEnd,
      practiceStart,
      practiceEnd,
    });

    // Clone survey fields from previous cohort or create defaults
    const previousCohorts = await cohortRepository.findAll();
    const sourceCohort = previousCohorts.find((c) => c.id !== cohort.id);

    if (sourceCohort) {
      await surveyFieldRepository.cloneFromCohort(sourceCohort.id, cohort.id);
    } else {
      // First cohort in the system — create default fields
      // Roles don't exist yet, so options for "Желаемая роль/трек" is left empty
      await surveyFieldRepository.createDefaults(cohort.id, '');
    }

    return cohort;
  },

  async findAll() {
    return cohortRepository.findAll();
  },

  async findById(id: string) {
    const cohort = await cohortRepository.findById(id);
    if (!cohort) {
      throw new NotFoundError('Cohort not found');
    }
    return cohort;
  },

  async update(id: string, data: {
    name?: string;
    applicationStart?: Date | string;
    applicationEnd?: Date | string;
    practiceStart?: Date | string;
    practiceEnd?: Date | string;
  }) {
    const existingCohort = await cohortRepository.findById(id);
    if (!existingCohort) {
      throw new NotFoundError('Cohort not found');
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.applicationStart) updateData.applicationStart = new Date(data.applicationStart);
    if (data.applicationEnd) updateData.applicationEnd = new Date(data.applicationEnd);
    if (data.practiceStart) updateData.practiceStart = new Date(data.practiceStart);
    if (data.practiceEnd) updateData.practiceEnd = new Date(data.practiceEnd);

    const appStart = updateData.applicationStart || existingCohort.applicationStart;
    const appEnd = updateData.applicationEnd || existingCohort.applicationEnd;
    const pracStart = updateData.practiceStart || existingCohort.practiceStart;
    const pracEnd = updateData.practiceEnd || existingCohort.practiceEnd;

    if (appStart >= appEnd) {
      throw new ValidationError('The application submission deadline must be later than the start date.');
    }

    if (pracStart >= pracEnd) {
      throw new ValidationError('The internship end date must be later than the start date.');
    }

    if (appEnd > pracStart) {
      throw new ValidationError('The application deadline must be prior to the start of the internship.');
    }

    if (data.name && data.name !== existingCohort.name) {
      const nameExists = await cohortRepository.findByName(data.name);
      if (nameExists) {
        throw new ConflictError(`Cohort with name "${data.name}" already exists`);
      }
    }

    return cohortRepository.update(id, updateData);
  },

  async findActive() {
    const activeCohort = await cohortRepository.findActive();
    if (!activeCohort) {
      throw new NotFoundError('Active cohort not found');
    }
    return activeCohort;
  },

  async delete(id: string) {
    const cohort = await cohortRepository.findById(id);
    if (!cohort) {
      throw new NotFoundError('Cohort not found');
    }
    return cohortRepository.delete(id);
  },
};