import { Request, Response, NextFunction } from 'express';
import { surveyService } from '../services/survey.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const surveyController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const { label, type, options, order, isRequired } = req.body;
      const field = await surveyService.create(cohortId, { label, type, options, order, isRequired });
      res.status(201).json(field);
    } catch (error) {
      next(error);
    }
  },

  async findByCohort(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cohortId = Array.isArray(id) ? id[0] : id;
      const fields = await surveyService.findByCohort(cohortId);
      res.json(fields);
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const fieldId = Array.isArray(id) ? id[0] : id;
      const data = req.body;
      const field = await surveyService.update(fieldId, data);
      res.json(field);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const fieldId = Array.isArray(id) ? id[0] : id;
      await surveyService.delete(fieldId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};