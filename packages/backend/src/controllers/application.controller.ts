import { Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/application.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const applicationController = {
  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { cohortId, answers } = req.body;
      const application = await applicationService.submit(userId, cohortId, answers);
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  },

  async getMyApplications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const applications = await applicationService.findAllByUser(userId);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  },

  async getPrefill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const prefill = await applicationService.getPrefillData(userId);
      res.json(prefill);
    } catch (error) {
      next(error);
    }
  },

  async findAllByCohort(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const applications = await applicationService.findAllByCohort(cohortId);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const applicationId = Array.isArray(id) ? id[0] : id;
      const { roleId } = req.body;
      const application = await applicationService.approve(applicationId, roleId);
      res.json(application);
    } catch (error) {
      next(error);
    }
  },

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const applicationId = Array.isArray(id) ? id[0] : id;
      const { reviewComment } = req.body;
      const application = await applicationService.reject(applicationId, reviewComment);
      res.json(application);
    } catch (error) {
      next(error);
    }
  },
};