import { Response, NextFunction } from 'express';
import { adminOverviewService } from '../services/adminOverview.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const adminOverviewController = {
  async getDocumentsOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cohortId } = req.params;
      const id = Array.isArray(cohortId) ? cohortId[0] : cohortId;
      const result = await adminOverviewService.getDocumentsOverview(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getTasksOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cohortId } = req.params;
      const id = Array.isArray(cohortId) ? cohortId[0] : cohortId;
      const result = await adminOverviewService.getTasksOverview(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
