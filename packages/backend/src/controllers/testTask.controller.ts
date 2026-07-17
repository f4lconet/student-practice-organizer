import { Request, Response, NextFunction } from 'express';
import { testTaskService } from '../services/testTask.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const testTaskController = {
  async upsert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const { content } = req.body;
      const testTask = await testTaskService.upsert(cohortId, content);
      res.status(200).json(testTask);
    } catch (error) {
      next(error);
    }
  },

  async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const testTask = await testTaskService.publish(cohortId);
      res.json(testTask);
    } catch (error) {
      next(error);
    }
  },

  async getForApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const applicationId = Array.isArray(id) ? id[0] : id;
      const userId = req.user!.id;
      const result = await testTaskService.getForApplication(applicationId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};