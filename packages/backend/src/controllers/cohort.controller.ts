import { Request, Response, NextFunction } from 'express';
import { cohortService } from '../services/cohort.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const cohortController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, applicationStart, applicationEnd, practiceStart, practiceEnd } = req.body;
      const cohort = await cohortService.create({
        name,
        applicationStart,
        applicationEnd,
        practiceStart,
        practiceEnd,
      });
      res.status(201).json(cohort);
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohorts = await cohortService.findAll();
      res.json(cohorts);
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cohortId = Array.isArray(id) ? id[0] : id;
      const cohort = await cohortService.findById(cohortId);
      res.json(cohort);
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cohortId = Array.isArray(id) ? id[0] : id;
      const data = req.body;
      const cohort = await cohortService.update(cohortId, data);
      res.json(cohort);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cohortId = Array.isArray(id) ? id[0] : id;
      await cohortService.delete(cohortId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async findActive(req: Request, res: Response, next: NextFunction) {
    try {
      const cohort = await cohortService.findActive();
      res.json(cohort);
    } catch (error) {
      next(error);
    }
  },
};