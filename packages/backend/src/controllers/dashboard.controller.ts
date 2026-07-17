import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const dashboardController = {
  async getMyDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dashboard = await dashboardService.getMyDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  },
};