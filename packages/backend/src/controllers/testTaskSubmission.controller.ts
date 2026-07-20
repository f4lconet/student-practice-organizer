import { Request, Response, NextFunction } from 'express';
import { testTaskSubmissionService } from '../services/testTaskSubmission.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const testTaskSubmissionController = {
  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applicationId = Array.isArray(req.params.applicationId)
        ? req.params.applicationId[0]
        : req.params.applicationId;
      const { content } = req.body;
      const userId = req.user!.id;

      const submission = await testTaskSubmissionService.submit(applicationId, userId, content);
      res.status(200).json(submission);
    } catch (error) {
      next(error);
    }
  },

  async getMySubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applicationId = Array.isArray(req.params.applicationId)
        ? req.params.applicationId[0]
        : req.params.applicationId;
      const userId = req.user!.id;

      const submission = await testTaskSubmissionService.getMySubmission(applicationId, userId);
      res.json({ submission });
    } catch (error) {
      next(error);
    }
  },

  async getSubmissionsForCohort(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cohortId = Array.isArray(req.params.cohortId)
        ? req.params.cohortId[0]
        : req.params.cohortId;

      const submissions = await testTaskSubmissionService.getSubmissionsForCohort(cohortId);
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  },
};