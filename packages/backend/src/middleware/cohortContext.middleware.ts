import { Request, Response, NextFunction } from 'express';
import { cohortRepository } from '../repositories/cohort.repository.js';
import { NotFoundError } from '../errors/index.js';

export interface CohortRequest extends Request {
  cohort?: {
    id: string;
    name: string;
    practiceStart: Date;
    practiceEnd: Date;
    applicationStart: Date;
    applicationEnd: Date;
  };
}

export const cohortContextMiddleware = async (
  req: CohortRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cohortId = req.params.cohortId || req.params.id;
    const id = Array.isArray(cohortId) ? cohortId[0] : cohortId
    if (!cohortId) {
      return next();
    }

    const cohort = await cohortRepository.findById(id);
    if (!cohort) {
      throw new NotFoundError('Cohort not found');
    }

    req.cohort = {
      id: cohort.id,
      name: cohort.name,
      practiceStart: cohort.practiceStart,
      practiceEnd: cohort.practiceEnd,
      applicationStart: cohort.applicationStart,
      applicationEnd: cohort.applicationEnd,
    };

    next();
  } catch (error) {
    next(error);
  }
};