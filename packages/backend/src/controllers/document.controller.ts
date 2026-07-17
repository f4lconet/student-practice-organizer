import { Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../errors/index.js';
import { DocumentType } from '../types/document.types.js';

interface MulterRequest extends AuthRequest {
  file?: any;
}

export const documentController = {
  async getOrCreate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { applicationId } = req.query;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;

      if (!applicationId || !cohortId) {
        throw new ValidationError('applicationId and cohortId are required');
      }

      const doc = await documentService.getOrCreate(userId, cohortId as string, applicationId as string);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const doc = await documentService.update(userId, cohortId as string, req.body);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async uploadReport(req: MulterRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const file = req.file;
      if (!file) {
        throw new ValidationError('File is required');
      }

      const fileUrl = `/uploads/${file.filename}`;
      const doc = await documentService.uploadReport(userId, cohortId as string, fileUrl);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const buffer = await documentService.generate(userId, cohortId as string, type);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${type}.docx"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async setReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const doc = await documentService.setReview(userId, cohortId, req.body);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  // ======================
  // NEW STUDENT ENDPOINTS
  // ======================

  async submitDocument(req: MulterRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const validTypes: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
      if (!validTypes.includes(type as DocumentType)) {
        throw new ValidationError(`Неверный тип документа: ${type}`);
      }

      const file = req.file;
      if (!file) {
        throw new ValidationError('File is required');
      }

      const fileUrl = `/uploads/${file.filename}`;
      const doc = await documentService.submitDocument(userId, cohortId as string, type as DocumentType, fileUrl);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const validTypes: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
      if (!validTypes.includes(type as DocumentType)) {
        throw new ValidationError(`Неверный тип документа: ${type}`);
      }

      const status = await documentService.getStatus(userId, cohortId as string, type as DocumentType);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async getMyDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cohortId = Array.isArray(req.query.cohortId) ? req.query.cohortId[0] : req.query.cohortId;

      if (!cohortId) {
        throw new ValidationError('cohortId is required');
      }

      const docs = await documentService.getMyDocuments(userId, cohortId as string);
      res.json(docs);
    } catch (error) {
      next(error);
    }
  },
};